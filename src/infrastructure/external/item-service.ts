import type {
	IItemService,
	ItemDetails,
} from "@repositories/gearscore/i-item-service.ts";
import { BlizzardApiError } from "../../domain/errors/blizzard-api-error.ts";
import type { DatabaseClient } from "../database/database-client-factory.ts";
import { IBlizzardItemService } from "src/domain/services/i-blizzard-item-service.ts";
import { BlizzardItemService } from "./blizzard-item-service.ts";


const LOCALE = "en_US";
const STATIC_NAMESPACE = "static-eu";

// Known item levels for items that may not be available in the API
const KNOWN_ITEM_LEVELS: Record<number, number> = {
	215161: 45,
	210781: 30,
	211450: 33,
	215111: 45,
	999999: 0,
	0: 0,
	216494: 45,
	213409: 45,
	213350: 45,
};

export class ItemService implements IItemService {
	private readonly blizzardItemService: IBlizzardItemService = new BlizzardItemService();
	constructor(private readonly supabase: DatabaseClient) { }

	async getItem(
		itemId: number,
		token: string,
		forceRefresh: boolean = false,
	): Promise<ItemDetails> {
		if (forceRefresh) {
			return this.fetchNewItem(token, itemId);
		}

		const cachedItem = await this.getItemFromDatabase(itemId);
		if (cachedItem && this.isCacheValid(cachedItem.lastUpdated)) {
			return cachedItem.details;
		}

		return this.fetchNewItem(token, itemId);
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
		const threeWeeksInMs = 1000 * 60 * 60 * 24 * 21;
		const lastUpdatedTime = new Date(lastUpdated).getTime();
		const now = new Date().getTime();
		return now - lastUpdatedTime < threeWeeksInMs;
	}

	private async fetchNewItem(
		token: string,
		itemId: number,
	): Promise<ItemDetails> {
		const [wowHeadItem, bnetDetails] = await Promise.all([
			this.fetchWoWHeadItem(itemId),
			this.fetchItemDetailsFromBlizzard(token, itemId),
		]);

		const itemDetails: ItemDetails = {
			...wowHeadItem,
			...bnetDetails,
			icon: wowHeadItem.icon,
		};

		// Save to database asynchronously (don't wait)
		this.saveItemToDatabase(itemId, itemDetails).catch((err) =>
			console.error("Failed to save item to database:", err)
		);

		return itemDetails;
	}

	private async fetchItemDetailsFromBlizzard(
		token: string,
		itemId: number,
	): Promise<Partial<ItemDetails>> {
		return await this.blizzardItemService.fetchItemDetails(token, itemId);
	}

	private async fetchWoWHeadItem(itemId: number): Promise<ItemDetails> {
		const url =
			`https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=4&locale=0`;
		const response = await fetch(url);
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
			itemLevel,
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
			display_id: 0,
			updated_at: new Date(),
		});

		if (error) {
			console.error("Error saving item to database:", error);
		}
	}
}
