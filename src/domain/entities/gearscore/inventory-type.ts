export type InventoryType =
	| "INVTYPE_HEAD"
	| "INVTYPE_NECK"
	| "INVTYPE_SHOULDER"
	| "INVTYPE_CHEST"
	| "INVTYPE_ROBE"
	| "INVTYPE_WAIST"
	| "INVTYPE_LEGS"
	| "INVTYPE_FEET"
	| "INVTYPE_WRIST"
	| "INVTYPE_HAND"
	| "INVTYPE_FINGER"
	| "INVTYPE_TRINKET"
	| "INVTYPE_CLOAK"
	| "INVTYPE_WEAPON"
	| "INVTYPE_SHIELD"
	| "INVTYPE_2HWEAPON"
	| "INVTYPE_TWOHWEAPON"
	| "INVTYPE_WEAPONMAINHAND"
	| "INVTYPE_WEAPONOFFHAND"
	| "INVTYPE_HOLDABLE"
	| "INVTYPE_RANGED"
	| "INVTYPE_THROWN"
	| "INVTYPE_RANGEDRIGHT"
	| "INVTYPE_RELIC"
	| "INVTYPE_BODY"
	| "INVTYPE_TABARD"
	| "INVTYPE_AMMO"
	| "INVTYPE_BAG";

export interface InventoryTypeInfo {
	slotModifier: number;
	isEnchantable: boolean;
}

export const INVENTORY_TYPE_INFO: Record<InventoryType, InventoryTypeInfo> = {
	INVTYPE_HEAD: { slotModifier: 1.0, isEnchantable: true },
	INVTYPE_NECK: { slotModifier: 0.5625, isEnchantable: false },
	INVTYPE_SHOULDER: { slotModifier: 0.75, isEnchantable: true },
	INVTYPE_CHEST: { slotModifier: 1.0, isEnchantable: true },
	INVTYPE_ROBE: { slotModifier: 1.0, isEnchantable: true },
	INVTYPE_WAIST: { slotModifier: 0.75, isEnchantable: false },
	INVTYPE_LEGS: { slotModifier: 1.0, isEnchantable: true },
	INVTYPE_FEET: { slotModifier: 0.75, isEnchantable: true },
	INVTYPE_WRIST: { slotModifier: 0.5625, isEnchantable: true },
	INVTYPE_HAND: { slotModifier: 0.75, isEnchantable: true },
	INVTYPE_FINGER: { slotModifier: 0.5625, isEnchantable: false },
	INVTYPE_TRINKET: { slotModifier: 0.5625, isEnchantable: false },
	INVTYPE_CLOAK: { slotModifier: 0.5625, isEnchantable: true },
	INVTYPE_WEAPON: { slotModifier: 1.0, isEnchantable: true },
	INVTYPE_SHIELD: { slotModifier: 1.0, isEnchantable: true },
	INVTYPE_2HWEAPON: { slotModifier: 2.0, isEnchantable: true },
	INVTYPE_TWOHWEAPON: { slotModifier: 2.0, isEnchantable: true },
	INVTYPE_WEAPONMAINHAND: { slotModifier: 1.0, isEnchantable: true },
	INVTYPE_WEAPONOFFHAND: { slotModifier: 1.0, isEnchantable: true },
	INVTYPE_HOLDABLE: { slotModifier: 1.0, isEnchantable: false },
	INVTYPE_RANGED: { slotModifier: 0.3164, isEnchantable: true },
	INVTYPE_THROWN: { slotModifier: 0.3164, isEnchantable: false },
	INVTYPE_RANGEDRIGHT: { slotModifier: 0.3164, isEnchantable: true },
	INVTYPE_RELIC: { slotModifier: 0.3164, isEnchantable: false },
	INVTYPE_BODY: { slotModifier: 0, isEnchantable: false },
	INVTYPE_TABARD: { slotModifier: 0, isEnchantable: false },
	INVTYPE_AMMO: { slotModifier: 0, isEnchantable: false },
	INVTYPE_BAG: { slotModifier: 0, isEnchantable: false },
};

export function isEnchantable(inventoryType: InventoryType): boolean {
	return INVENTORY_TYPE_INFO[inventoryType]?.isEnchantable || false;
}
