import type { EquippedItem } from "@entities/gearscore/equipped-item.ts";
import { INVENTORY_TYPE_INFO } from "@entities/gearscore/inventory-type.ts";
import { ItemQuality } from "@entities/gearscore/item-quality.ts";
import type { GearScoreColor } from "@entities/gearscore/gear-score.ts";

// Single linear formula table (no hard item level breakpoint).
type FormulaCoefficients = { A: number; B: number };

const GS_FORMULA: Partial<Record<ItemQuality, FormulaCoefficients>> = {
	[ItemQuality.EPIC]:     { A: 26.0, B: 1.2 },
	[ItemQuality.RARE]:     { A: 0.75, B: 1.8 },
	[ItemQuality.UNCOMMON]: { A: 8.0, B: 2.0 },
	[ItemQuality.COMMON]:   { A: 0.0, B: 2.25 },
};

const BRACKET_SIZE = 400;
const MAX_GEAR_SCORE = BRACKET_SIZE * 6 - 1; // 2399 for TBC
const GS_SCALE = 1.8618;
const GS_ENCHANT_MODIFIER = 1.05;
const GS_GEM_SCORE_PER_GEM = 5;

const HUNTER_MELEE_SLOTS = [
	"INVTYPE_2HWEAPON",
	"INVTYPE_WEAPONMAINHAND",
	"INVTYPE_WEAPONOFFHAND",
	"INVTYPE_WEAPON",
	"INVTYPE_HOLDABLE",
];
const HUNTER_RANGED_SLOTS = ["INVTYPE_RANGED", "INVTYPE_RANGEDRIGHT"];

export class GearScoreCalculator {
	/**
	 * Calculates the gear score for a single item (GearScoreLite formula)
	 */
	calculateItemScore(item: EquippedItem, classToken?: string): number {
		const typeInfo = INVENTORY_TYPE_INFO[item.inventoryType];
		if (!typeInfo) {
			return 0;
		}

		const { slotModifier, isEnchantable } = typeInfo;
		let rarity: number = item.quality;
		let itemLevel = item.itemLevel;
		let qualityScale = 1;
		// Rarity adjustments (from GearScoreLite)
		if (rarity === ItemQuality.LEGENDARY) {
			qualityScale = 1.3;
			rarity = ItemQuality.EPIC;
		} else if (rarity === ItemQuality.COMMON) {
			qualityScale = 0.005;
			rarity = ItemQuality.UNCOMMON;
		} else if (rarity === ItemQuality.POOR) {
			qualityScale = 0.005;
			rarity = ItemQuality.UNCOMMON;
		} else if (rarity === ItemQuality.HEIRLOOM) {
			rarity = ItemQuality.RARE;
			itemLevel = 187.05;
		}

		const coefficients = GS_FORMULA[rarity as ItemQuality];
		if (!coefficients) {
			return 0;
		}

		let gearScore = Math.floor(
			((itemLevel - coefficients.A) / coefficients.B) *
			slotModifier * GS_SCALE * qualityScale,
		);

		if (gearScore < 0) {
			gearScore = 0;
		}

		// Hunter class adjustments (from GearScoreLite)
		if (classToken === "HUNTER") {
			if (HUNTER_MELEE_SLOTS.includes(item.inventoryType)) {
				gearScore = Math.floor(gearScore * 0.3164);
			} else if (HUNTER_RANGED_SLOTS.includes(item.inventoryType)) {
				gearScore = Math.floor(gearScore * 5.3224);
			}
		}

		// Enchant bonus (addon enhancement)
		if (isEnchantable && item.isEnchanted) {
			gearScore = Math.floor(gearScore * GS_ENCHANT_MODIFIER);
		}

		// Gem bonus (addon enhancement)
		gearScore += (item.gems?.length ?? 0) * GS_GEM_SCORE_PER_GEM;

		return gearScore;
	}

	/**
	 * Calculates total gear score from a collection of items
	 */
	calculateTotalGearScore(items: EquippedItem[], classToken?: string): number {
		const totalScore = items.reduce(
			(sum, item) => sum + this.calculateItemScore(item, classToken),
			0,
		);
		return Math.floor(totalScore + 0.5);
	}

	/**
	 * Determines the color category for a given gear score.
	 * Uses 6 bracket thresholds aligned with GearScoreLite's GS_Quality table.
	 * Each bracket spans BRACKET_SIZE (400) points, mapped to 7 color names.
	 */
	getColorForGearScore(gearScore: number): GearScoreColor {
		const percentile = (gearScore / MAX_GEAR_SCORE) * 100;

		if (percentile >= 100) {
			return "relic";
		} else if (percentile >= 83) {
			return "pink";
		} else if (percentile >= 67) {
			return "legendary";
		} else if (percentile >= 50) {
			return "epic";
		} else if (percentile >= 33) {
			return "rare";
		} else if (percentile >= 17) {
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
