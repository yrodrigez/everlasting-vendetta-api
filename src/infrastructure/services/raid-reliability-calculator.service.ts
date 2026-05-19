import {
    RRSCalculator,
    RSSCalculatorInput,
    RSSCalculatorOutput,
} from "src/application/ports/raid-resets/raid-readiness-score-calculator.port";

const FULL_ENCHANT_MULTIPLIER = 1.175; // 17.5% increase
const PRIORITY_ROLE_MULTIPLIER = 1.09; // 9% increase
const ALTERS_PRIORITY_ROLE_MULTIPLIER = 0.91; // 9% decrease
const IS_FULLY_GEMMED_ACTIVE_TEST_FLAG = true; // Whether to apply the fully gemmed multiplier or not. We can activate this once most of the players are fully gemmed.
const IS_FULLY_GEMMED_MULTIPLIER = 1.15; // 15% increase for being fully gemmed (Deactivated for now, as many people are not yet fully gemmed and we don't want to penalize them)

const NEUTRAL_RELIABILITY = 55;
const FULL_CONFIDENCE_AFTER_WEEKS = 8;

export class RaidReadinessScoreCalculatorService implements RRSCalculator {

    private getReliabilityConfidence(weeksConsidered: number): number {
        return Math.min(weeksConsidered / FULL_CONFIDENCE_AFTER_WEEKS, 1)
    }

    private getEffectiveReliability(
        reliability: number,
        weeksConsidered: number
    ): number {
        const confidence = this.getReliabilityConfidence(weeksConsidered)

        return (
            NEUTRAL_RELIABILITY * (1 - confidence) + reliability * confidence
        )
    }

    private getSignupTimingMultiplier(
        signedUpAt: Date,
        raidDateTime: Date
    ): number {
        const msBeforeRaid = raidDateTime.getTime() - signedUpAt.getTime();
        const hoursBeforeRaid = Math.max(0, msBeforeRaid / (1000 * 60 * 60));
        const cappedHours = Math.min(hoursBeforeRaid, 72);
        const latestSignupMultiplier = 0.88; // 12% decrease for last-minute signups
        const earliestSignupMultiplier = 1.05; // 5% increase for early signups
        // Scale from 0.88 to 1.05 over 72 hours
        return (
            latestSignupMultiplier +
            (cappedHours / 72) *
            (earliestSignupMultiplier - latestSignupMultiplier)
        );
    }

    private applyMultipliers = (
        rrs: number,
        isFullEnchanted: boolean,
        isPriorityRole: boolean,
        isAlter: boolean,
        signedUpAt: Date,
        raidDateTime: Date,
        isFullyGemmed: boolean,
        isFullyGemmedActive: boolean
    ): { rrs: number, multipliers: Record<string, number> } => {
        let modifiedRRS = rrs;
        const multipliers: Record<string, number> = {};

        const enchantMultiplier = isFullEnchanted ? FULL_ENCHANT_MULTIPLIER : 1;
        modifiedRRS *= enchantMultiplier;
        multipliers.fullEnchant = isFullEnchanted ? enchantMultiplier : 1;

        const priorityRoleMultiplier = isPriorityRole
            ? PRIORITY_ROLE_MULTIPLIER
            : 1;
        modifiedRRS *= priorityRoleMultiplier;
        multipliers.priorityRole = isPriorityRole ? priorityRoleMultiplier : 1;

        const alterMultiplier = isAlter ? ALTERS_PRIORITY_ROLE_MULTIPLIER : 1;
        modifiedRRS *= alterMultiplier;
        multipliers.alter = isAlter ? alterMultiplier : 1;

        const timingMultiplier = this.getSignupTimingMultiplier(
            signedUpAt,
            raidDateTime
        );
        modifiedRRS *= timingMultiplier;
        multipliers.signupTiming = timingMultiplier;
        if (isFullyGemmedActive) {
            const fullyGemmedMultiplier = isFullyGemmed
                ? IS_FULLY_GEMMED_MULTIPLIER
                : 1;
            // modifiedRRS *= fullyGemmedMultiplier; // Do not apply this yet. People is not yet prepared.
            multipliers.fullyGemmed = isFullyGemmed ? fullyGemmedMultiplier : 1;
        }

        return { rrs: modifiedRRS, multipliers };
    };

    calculateReadinessScore({
        weeksSinceAccountCreation,
        raidReliabilityRating,
        isFullEnchanted,
        isPriorityRole,
        isAlter,
        signedUpAt,
        raidDateTime,
        isFullyGemmed = false,
        isFullyGemmedActive = IS_FULLY_GEMMED_ACTIVE_TEST_FLAG,
    }: RSSCalculatorInput): RSSCalculatorOutput {
        const effectiveReliability = this.getEffectiveReliability(
            raidReliabilityRating,
            weeksSinceAccountCreation
        );

        const { rrs, multipliers } = this.applyMultipliers(
            effectiveReliability,
            isFullEnchanted,
            isPriorityRole,
            isAlter,
            signedUpAt,
            raidDateTime,
            isFullyGemmed,
            isFullyGemmedActive
        );

        const confidence = this.getReliabilityConfidence(weeksSinceAccountCreation);
        return {
            rrs,
            multipliers,
            reliabilityAdjustment: {
                observedReliability: rrs,
                neutralReliability: NEUTRAL_RELIABILITY,
                confidence: confidence,
                neutralWeight: 1 - confidence,
                effectiveReliability: effectiveReliability,
                weeksConsidered: weeksSinceAccountCreation,
                fullConfidenceAfterWeeks: FULL_CONFIDENCE_AFTER_WEEKS,
            }
        }
    }
}
