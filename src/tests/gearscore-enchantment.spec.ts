import { describe, expect, it } from "@jest/globals";
import { isFullyEnchanted } from "../application/services/gear-score/gearscore-enchantment";

describe("isFullyEnchanted", () => {
    it("ignores tabards, ranged slots, and non-enchantable slots", () => {
        expect(
            isFullyEnchanted([
                { inventoryType: "INVTYPE_HEAD", isEnchanted: true },
                { inventoryType: "INVTYPE_NECK", isEnchanted: false },
                { inventoryType: "INVTYPE_RANGED", isEnchanted: false },
                { inventoryType: "INVTYPE_TABARD", isEnchanted: false },
            ])
        ).toBe(true);
    });

    it("returns false when an enchantable non-ranged slot is missing an enchant", () => {
        expect(
            isFullyEnchanted([
                { inventoryType: "INVTYPE_HEAD", isEnchanted: true },
                { inventoryType: "INVTYPE_CHEST", isEnchanted: false },
            ])
        ).toBe(false);
    });
});
