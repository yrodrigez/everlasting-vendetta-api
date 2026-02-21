import type { InventoryType } from "./inventory-type.ts";
import { ItemQuality } from "./item-quality.ts";

export interface EquippedItem {
	readonly id: number;
	readonly inventoryType: InventoryType;
	readonly isEnchanted: boolean;
	readonly itemLevel: number;
	readonly quality: ItemQuality;
	readonly gems: Array<{
		readonly id: number;
		readonly itemId: number;
		readonly fetchUrl: string;
		readonly displayString: string;
	}>;
}

export interface EquippedItemRaw {
	readonly id: number;
	readonly type: string;
	readonly isEnchanted: boolean;
}

export function createEquippedItem(
	id: number,
	inventoryType: InventoryType,
	isEnchanted: boolean,
	itemLevel: number,
	quality: ItemQuality,
	gems: EquippedItem['gems'] = [],
): EquippedItem {
	if (id <= 0) {
		throw new Error("Item ID must be greater than 0");
	}
	if (itemLevel < 0) {
		throw new Error("Item level cannot be negative");
	}

	return {
		id,
		inventoryType,
		isEnchanted,
		itemLevel,
		quality,
		gems,
	};
}
