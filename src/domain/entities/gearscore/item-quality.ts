export enum ItemQuality {
	POOR = 0,
	COMMON = 1,
	UNCOMMON = 2,
	RARE = 3,
	EPIC = 4,
	LEGENDARY = 5,
}

export const ITEM_QUALITY_NAMES: Record<ItemQuality, string> = {
	[ItemQuality.POOR]: "POOR",
	[ItemQuality.COMMON]: "COMMON",
	[ItemQuality.UNCOMMON]: "UNCOMMON",
	[ItemQuality.RARE]: "RARE",
	[ItemQuality.EPIC]: "EPIC",
	[ItemQuality.LEGENDARY]: "LEGENDARY",
};
