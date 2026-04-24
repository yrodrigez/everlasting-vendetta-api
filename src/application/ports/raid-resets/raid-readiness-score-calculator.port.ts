export type RSSCalculatorInput = {
    characterName: string,
    realmSlug: string,
    weeksSinceAccountCreation: number,
    raidReliabilityRating: number,
    isFullEnchanted: boolean,
    isPriorityRole: boolean,
    isAlter: boolean,
    signedUpAt: Date,
    raidDateTime: Date
}

export type RSSCalculatorOutput = {
    rrs: number;
    multipliers: Record<string, number>;
}

export interface RRSCalculator {
    calculateReadinessScore(input: RSSCalculatorInput): RSSCalculatorOutput
}