export type GearScoreColor =
    | "relic"
    | "pink"
    | "legendary"
    | "epic"
    | "rare"
    | "uncommon"
    | "common";

export interface GearScore {
    readonly characterName: string;
    readonly score: number;
    readonly color: GearScoreColor;
    readonly hash: string;
    readonly isFullEnchanted: boolean;
    readonly isFullyGemmed: boolean;
}

export function createGearScore(
    characterName: string,
    score: number,
    color: GearScoreColor,
    hash: string,
    isFullEnchanted: boolean,
    isFullyGemmed: boolean
): GearScore {
    if (!characterName || characterName.trim().length === 0) {
        throw new Error("Character name cannot be empty");
    }
    if (score < 0) {
        throw new Error("Gear score cannot be negative");
    }
    if (!hash || hash.trim().length === 0) {
        throw new Error("Hash cannot be empty");
    }

    return {
        characterName: characterName.toLowerCase(),
        score,
        color,
        hash,
        isFullEnchanted,
        isFullyGemmed,
    };
}
