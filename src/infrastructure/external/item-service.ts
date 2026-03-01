import type {
	IItemService,
	ItemDetails,
} from "@repositories/gearscore/i-item-service.ts";
import type { DatabaseClient } from "../database/database-client-factory.ts";
export class ItemService implements IItemService {
	constructor(
		private readonly supabase: DatabaseClient,

	) { }

	async getItem(
		itemId: number,
		forceRefresh: boolean = false,
	): Promise<ItemDetails> {
		if (forceRefresh) {
			console.log(`Force refreshing item: '${itemId}'`);
			return this.fetchNewItem(itemId);
		}

		const cachedItem = await this.getItemFromDatabase(itemId);
		if (cachedItem && this.isCacheValid(cachedItem.lastUpdated)) {
			return cachedItem.details;
		}

		return this.fetchNewItem(itemId);
	}

	private async getItemFromDatabase(
		itemId: number,
	): Promise<{ details: ItemDetails; lastUpdated: string } | null> {
		const { data, error } = await this.supabase
			.from("wow_items")
			.select("*")
			.eq("id", itemId)
			.limit(1)
			.maybeSingle();

		if (error) {
			console.error("Error fetching item from database:", error);
			return null;
		}

		if (!data?.details) {
			return null;
		}

		return {
			details: data.details,
			lastUpdated: data.updated_at,
		};
	}

	private isCacheValid(lastUpdated: string): boolean {
		const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 180; // 180 days
		const lastUpdatedTime = new Date(lastUpdated).getTime();
		const now = new Date().getTime();
		return (now - lastUpdatedTime) < CACHE_TTL_MS;
	}

	private async fetchNewItem(
		itemId: number,

	): Promise<ItemDetails> {
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
			console.error("Failed to save item to database:", err)
		);

		return itemDetails;
	}

	private async getItemDisplayId(id: number): Promise<number> {
		const baseUrl = `https://www.wowhead.com/item=${id}`;
		const response = await fetch(baseUrl);
		if (!response.ok) {
			console.error(`Error fetching item display id: '${id}', status: ${response.status}`);
			return 0;
		}
		const data = await response.text();

		const regex = /&quot;displayId&quot;\s*:\s*([0-9]+)/
		const match = data.match(regex);
		if (!match) {
			console.warn(`No match for display id in item: '${id}'`);
			return 0;
		}
		const displayId = match[1];

		return +displayId;
	}

	private async fetchWoWHeadItem(itemId: number, env: number = 4): Promise<ItemDetails> {
		const url =
			`https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=${env}&locale=0`;
		const response = await fetch(url);

		if (!response.ok && env === 4) {
			// retry with 5 for TBC items
			return this.fetchWoWHeadItem(itemId, 5);
		}

		if (!response.ok) {
			throw new Error(
				`ItemService::fetchWoWHeadItem - Failed to fetch WoWHead item ${itemId}: ${response.status} ${response.statusText} (env: ${env})`,
			);
		}

		const data = await response.json() as {
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
			/Item\s*Level\s*(?:<!--ilvl-->)?\s*(\d+)/i,
		);
		const itemLevel = itemLevelMatch ? parseInt(itemLevelMatch[1]) : 0;

		return {
			icon: `https://wow.zamimg.com/images/wow/icons/medium/${data.icon}.jpg`,
			level: itemLevel,
			name: data.name,
			id: data.id ?? null,
			tooltip: data.tooltip,
			itemLevel: itemLevel,
			quality: {
				type: qualityName.toUpperCase(),
				name: qualityName[0].toUpperCase() + qualityName.slice(1),
			},

		};
	}

	private async saveItemToDatabase(
		itemId: number,
		itemDetails: ItemDetails,
	): Promise<void> {
		const { error } = await this.supabase.from("wow_items").upsert({
			id: itemId,
			details: itemDetails,
			display_id: itemDetails.displayId,
			updated_at: new Date(),
		});

		if (error) {
			console.error("Error saving item to database:", error);
		}
	}
}
