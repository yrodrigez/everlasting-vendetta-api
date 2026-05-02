import {
    type InventoryType,
    isEnchantable,
} from "@entities/gearscore/inventory-type";

export type EnchantmentEquipmentItem = {
    readonly inventoryType: string;
    readonly isEnchanted: boolean;
};

export function isFullyEnchanted(
    equippedItems: EnchantmentEquipmentItem[]
): boolean {
    return equippedItems
        .filter(
            ({ inventoryType }) =>
                inventoryType.toLowerCase().indexOf("tabard") === -1
        )
        .filter(({ inventoryType }) =>
            isEnchantable(inventoryType as InventoryType)
        )
        .filter(({ inventoryType }) => !inventoryType.includes("RANGED"))
        .every((item) => item.isEnchanted);
}
