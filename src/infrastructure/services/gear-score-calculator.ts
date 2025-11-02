import type { EquippedItem } from "@entities/gearscore/equipped-item.ts";
import { INVENTORY_TYPE_INFO } from "@entities/gearscore/inventory-type.ts";
import { ItemQuality } from "@entities/gearscore/item-quality.ts";
import type { GearScoreColor } from "@entities/gearscore/gear-score.ts";

const RARITY_MODIFIERS: Record<ItemQuality, number> = {
	[ItemQuality.POOR]: 3.5,
	[ItemQuality.COMMON]: 3,
	[ItemQuality.UNCOMMON]: 2.5,
	[ItemQuality.RARE]: 1.76,
	[ItemQuality.EPIC]: 1.6,
	[ItemQuality.LEGENDARY]: 1.4,
};

const GLOBAL_SCALE = 1.7;
const ENCHANTMENT_MODIFIER = 1.05;
const MAX_GEAR_SCORE = 1000;

export class GearScoreCalculator {
	/**
	 * Calculates the gear score for a single item
	 */
	calculateItemScore(item: EquippedItem): number {
		const typeInfo = INVENTORY_TYPE_INFO[item.inventoryType];
		if (!typeInfo) {
			return 0;
		}

		const { slotModifier, isEnchantable } = typeInfo;
		const rarityModifier = RARITY_MODIFIERS[item.quality] || 1;
		const enchantModifier = isEnchantable && item.isEnchanted
			? ENCHANTMENT_MODIFIER
			: 1;

		return (
			(item.itemLevel / rarityModifier) *
			slotModifier *
			enchantModifier *
			GLOBAL_SCALE
		);
	}

	/**
	 * Calculates total gear score from a collection of items
	 */
	calculateTotalGearScore(items: EquippedItem[]): number {
		const totalScore = items.reduce(
			(sum, item) => sum + this.calculateItemScore(item),
			0,
		);
		return Math.floor(totalScore + 0.5);
	}

	/**
	 * Determines the color category for a given gear score
	 */
	getColorForGearScore(gearScore: number): GearScoreColor {
		const percentile = (gearScore / MAX_GEAR_SCORE) * 100;

		if (percentile >= 100) {
			return "relic";
		} else if (percentile >= 99) {
			return "pink";
		} else if (percentile >= 95) {
			return "legendary";
		} else if (percentile >= 75) {
			return "epic";
		} else if (percentile >= 50) {
			return "rare";
		} else if (percentile >= 25) {
			return "uncommon";
		} else {
			return "common";
		}
	}

	/**
	 * Creates a hash from equipped items for caching purposes
	 */
	async createEquipmentHash(items: Array<{
		id: number;
		type: string;
		isEnchanted: boolean;
	}>): Promise<string> {
		const sortedItems = [...items].sort((a, b) => a.id - b.id);
		const str = JSON.stringify(sortedItems);
		const data = new TextEncoder().encode(str);
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);

		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	}
}
