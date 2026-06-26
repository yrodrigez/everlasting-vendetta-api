import type {
    IItemService,
    ItemDetails,
} from "@repositories/gearscore/i-item-service.ts";
import type { DatabaseClient } from "../database/database-client-factory.ts";
import { createLogger } from "@infrastructure/logging/index.ts";

type CachedWowItem = {
    expiresAt: number;
    data: ItemDetails;
};

const itemCache: Map<number, CachedWowItem> = new Map();
const MAX_CACHE_ITEMS = 5000; // maximum number of items to keep in cache

const CACHE_DURATION_MS = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
export class ItemService implements IItemService {
    private readonly isCacheValid = (cachedItem: CachedWowItem): boolean => {
        return cachedItem.expiresAt > Date.now();
    };

    private readonly getFromCache = (itemId: number): ItemDetails | null => {
        const cachedItem = itemCache.get(itemId);
        if (cachedItem && this.isCacheValid(cachedItem)) {
            itemCache.delete(itemId);
            this.setCache(itemId, cachedItem.data); // renew expiration on access
            return cachedItem.data;
        }

        itemCache.delete(itemId); // remove stale cache entry if expired
        return null;
    };

    private readonly setCache = (
        itemId: number | string,
        itemDetails: ItemDetails
    ): void => {
        if (itemCache.size >= MAX_CACHE_ITEMS) {
            // Remove the oldest item from the cache
            const oldestKey = itemCache.keys().next().value;
            if (oldestKey !== undefined) {
                itemCache.delete(oldestKey);
            }
        }
        itemCache.set(parseInt(itemId.toString()), {
            expiresAt: Date.now() + CACHE_DURATION_MS,
            data: itemDetails,
        });
    };

    constructor(
        private readonly supabase: DatabaseClient,
        private readonly logger = createLogger("ItemService")
    ) {}

    async getItem(
        itemId: number,
        forceRefresh: boolean = false
    ): Promise<ItemDetails> {
        if (forceRefresh) {
            this.logger.info(`Force refreshing item: '${itemId}'`);
            const newItem = await this.fetchNewItem(itemId);
            this.setCache(itemId, newItem);
            return newItem;
        }

        const cachedItem = this.getFromCache(itemId);
        if (cachedItem) {
            return cachedItem;
        }

        const dbCached = await this.getItemFromDatabase(itemId);
        if (
            dbCached &&
            this.isDBCacheValid(
                dbCached.lastUpdated,
                dbCached.details.sockets
            ) &&
            dbCached.details.id
        ) {
            this.setCache(itemId, dbCached.details);
            this.logger.info(`Database cache hit for item: '${itemId}'`);
            return dbCached.details;
        }

        const newItem = await this.fetchNewItem(itemId);
        this.logger.info(
            `Fetched new data for item: '${itemId}' from WoWHead and updating cache/database`
        );
        this.setCache(itemId, newItem);
        return newItem;
    }

    private async getItemFromDatabase(
        itemId: number
    ): Promise<{ details: ItemDetails; lastUpdated: string } | null> {
        const { data, error } = await this.supabase
            .from("wow_items")
            .select("*")
            .eq("id", itemId)
            .limit(1)
            .maybeSingle();

        if (error) {
            this.logger.error("Error fetching item from database:", error);
            return null;
        }

        if (!data?.details) {
            this.logger.info(`No details found for item: '${itemId}'`);
            return null;
        }

        return {
            details: data.details,
            lastUpdated: data.updated_at,
        };
    }

    private isDBCacheValid(
        lastUpdated: string,
        sockets?: Array<{ type: string }>
    ): boolean {
        if (sockets && sockets.length > 0) {
            return true; // if item has sockets, we consider the cache valid regardless of age, since sockets are critical for gear score and don't change often
        }

        const lastUpdatedDate = new Date(lastUpdated);
        const socketAddtionDate = new Date("2026-05-03"); // hypothetical date when sockets were added to items in the database

        return lastUpdatedDate > socketAddtionDate; // if item was last updated before sockets were added, we consider the cache invalid
    }

    private async fetchNewItem(itemId: number): Promise<ItemDetails> {
        const [wowHeadItem, displayId] = await Promise.all([
            this.fetchWoWHeadItem(itemId),
            this.getItemDisplayId(itemId),
        ]);

        const itemDetails: ItemDetails = {
            ...wowHeadItem,
            icon: wowHeadItem.icon,
            displayId: displayId,
        };

        // Save to database asynchronously (don't wait)
        this.saveItemToDatabase(itemId, itemDetails).catch((err) =>
            this.logger.error("Failed to save item to database:", err)
        );

        return itemDetails;
    }

    private async getItemDisplayId(id: number): Promise<number> {
        const baseUrl = `https://www.wowhead.com/item=${id}`;
        const response = await fetch(baseUrl);
        if (!response.ok) {
            this.logger.error(
                `Error fetching item display id: '${id}', status: ${response.status}`
            );
            return 0;
        }
        const data = await response.text();

        const regex = /&quot;displayId&quot;\s*:\s*([0-9]+)/;
        const match = data.match(regex);
        if (!match) {
            this.logger.warn(`No match for display id in item: '${id}'`);
            return 0;
        }
        const displayId = match[1];

        return +displayId;
    }

    private async fetchWoWHeadItem(
        itemId: number,
        env: number = 4
    ): Promise<ItemDetails> {
        const url = `https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=${env}&locale=0`;
        const response = await fetch(url);

        if (!response.ok && env === 4) {
            // retry with 5 for TBC items
            return this.fetchWoWHeadItem(itemId, 5);
        }

        if (!response.ok) {
            throw new Error(
                `ItemService::fetchWoWHeadItem - Failed to fetch WoWHead item ${itemId}: ${response.status} ${response.statusText} (env: ${env})`
            );
        }

        const data = (await response.json()) as {
            icon: string;
            quality: number;
            name: string;
            id: number;
            tooltip: string;
            spells: any[];
        };

        const qualityNames = [
            "poor",
            "common",
            "uncommon",
            "rare",
            "epic",
            "legendary",
            "artifact",
            "heirloom",
        ];

        const qualityName = qualityNames[data.quality ?? 0];
        const itemLevelMatch = data.tooltip.match(
            /Item\s*Level\s*(?:<!--ilvl-->)?\s*(\d+)/i
        );
        const itemLevel = itemLevelMatch ? parseInt(itemLevelMatch[1]) : 0;

        const sockets =
            data.tooltip
                .match(/<a.*?class="socket-.*?">.*?<\/a>/g)
                ?.map((socketHtml: string) => {
                    const socketTypeMatch = socketHtml.match(
                        /<a.*?class="socket-(prismatic|red|blue|yellow|meta)\S*.*?">/
                    );
                    const socketType = socketTypeMatch
                        ? socketTypeMatch[1]
                        : "unknown";
                    return { type: socketType };
                }) || [];

        return {
            icon: `https://wow.zamimg.com/images/wow/icons/medium/${data.icon}.jpg`,
            level: itemLevel,
            name: data.name,
            id: data.id ?? itemId,
            tooltip: data.tooltip,
            itemLevel: itemLevel,
            quality: {
                type: qualityName.toUpperCase(),
                name: qualityName[0].toUpperCase() + qualityName.slice(1),
            },
            sockets,
        };
    }

    private async saveItemToDatabase(
        itemId: number,
        itemDetails: ItemDetails
    ): Promise<void> {
        const { error } = await this.supabase.from("wow_items").upsert({
            id: itemId,
            details: itemDetails,
            display_id: itemDetails.displayId,
            updated_at: new Date(),
        });

        if (error) {
            this.logger.error("Error saving item to database:", error);
        }
    }
}
