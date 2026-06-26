import type { GearScoreColor } from "@entities/gearscore/gear-score.ts";

export interface CachedGearScore {
    readonly score: number;
    readonly color: GearScoreColor;
    readonly isFullyGemmed: boolean;
}

export interface IGearScoreCacheRepository {
    /**
     * Retrieves a cached gear score by its equipment hash
     */
    getByHash(hash: string): Promise<CachedGearScore | null>;

    /**
     * Saves or updates a gear score in the cache
     */
    save(
        hash: string,
        score: number,
        color: GearScoreColor,
        isFullyGemmed: boolean
    ): Promise<void>;
}
