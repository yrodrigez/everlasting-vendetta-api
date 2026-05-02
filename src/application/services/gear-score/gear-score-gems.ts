const UNWANTED_GEMS = [
    // IDs of gems that we want to ignore when calculating if a character is fully gemmed, because they don't provide a significant stat increase and can be used as fillers
    23094,
    23097, 23096, 23095, 28595, 28290, 23116, 31860, 23114, 23115, 23113, 23118,
    23119, 23121, 23120, 31869, 23099, 31866, 23098, 23101, 23100, 31864, 23110,
    31862, 23109, 23111, 23108, 32833, 23105, 23104, 23103, 23106, 23094,
    // whte quality gems that can be used as fillers
    28458,
    28460,
    28459,
    28461,
    28468,
    28470,
    28467,
    28469,
    28466,
    28465,
    28463,
    28464
];

export type ItemWithGemsAndSockets = {
    sockets: {
        type: string;
    }[];
    gems: {
        itemId: number;
    }[];
}

export const calculateIsFullyGemmed = (equipment: ItemWithGemsAndSockets[]): boolean => {
    return equipment.every((item) => {
        const expectedGems = (item.sockets ?? []).length;
        const itemGems = item.gems ?? [];
        const hasGems = itemGems.length > 0;

        if (!hasGems && expectedGems === 0) {
            return true; // No gems needed and none present, so it's fully gemmed
        }

        if (hasGems && expectedGems === 0) {
            throw new Error(`Item has gems but no sockets, which is unexpected. Item: ${JSON.stringify(item)}`);
        }

        const onlyRelevantGems = (item.gems ?? []).filter((gem) => !UNWANTED_GEMS.includes(gem.itemId));
        const gemsCount = onlyRelevantGems.length;

        return gemsCount === expectedGems;
    })
}