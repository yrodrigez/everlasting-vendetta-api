export type RSSCalculatorInput = {
    characterName: string;
    realmSlug: string;
    weeksSinceAccountCreation: number;
    raidReliabilityRating: number;
    isFullEnchanted: boolean;
    isFullyGemmed?: boolean;
    isPriorityRole: boolean;
    isAlter: boolean;
    signedUpAt: Date;
    raidDateTime: Date;
    isFullyGemmedActive?: boolean;
};

export type RSSCalculatorOutput = {
    rrs: number;
    multipliers: Record<string, number>;
    reliabilityAdjustment: {
        observedReliability: number;
        neutralReliability: number;
        confidence: number;
        neutralWeight: number;
        effectiveReliability: number;
        weeksConsidered: number;
        fullConfidenceAfterWeeks: number;
    };
};

export interface RRSCalculator {
    calculateReadinessScore(input: RSSCalculatorInput): RSSCalculatorOutput;
}
