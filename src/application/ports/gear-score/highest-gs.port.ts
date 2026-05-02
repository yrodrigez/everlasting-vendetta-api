import type { GearScoreColor } from "@entities/gearscore/gear-score";

export type HighestGS = {
    characterName: string;
    realmSlug: string;
    createdAt: Date;
    updatedAt: Date;
    details: {
        gs: number;
        hash: string;
        color: GearScoreColor;
        isFullEnchanted: boolean;
        isFullyGemmed: boolean;
    };
};

export interface HighestGSPort {
    getHighestGS(
        characterName: string,
        realmSlug: string
    ): Promise<HighestGS | null>;
    saveHighestGS(gs: HighestGS): Promise<HighestGS>;
}
