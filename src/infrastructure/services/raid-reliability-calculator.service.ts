import { RRSCalculator, RSSCalculatorInput, RSSCalculatorOutput } from "src/application/ports/raid-resets/raid-readiness-score-calculator.port";

const FULL_ENCHANT_MULTIPLIER = 1.175 // 17.5% increase 
const PRIORITY_ROLE_MULTIPLIER = 1.135 // 13.5% increase
const ALTERS_PRIORITY_ROLE_MULTIPLIER = 0.91 // 9% decrease

export class RaidReadinessScoreCalculatorService implements RRSCalculator {
    private getNewPlayerReliabilityFloor(weeksConsidered: number): number {
        if (weeksConsidered <= 1) return 45
        if (weeksConsidered === 2) return 50
        if (weeksConsidered === 3) return 55

        return 0
    }

    private getEffectiveReliability = (
        reliability: number,
        weeksConsidered: number
    ) => {
        const floor = this.getNewPlayerReliabilityFloor(weeksConsidered)

        return Math.max(reliability, floor)
    }

    private getSignupTimingMultiplier(signedUpAt: Date, raidDateTime: Date): number {
        const msBeforeRaid = raidDateTime.getTime() - signedUpAt.getTime();
        const hoursBeforeRaid = Math.max(0, msBeforeRaid / (1000 * 60 * 60));
        const cappedHours = Math.min(hoursBeforeRaid, 72);
        const latestSignupMultiplier = 0.88; // 12% decrease for last-minute signups
        const earliestSignupMultiplier = 1.05; // 5% increase for early signups
        // Scale from 0.88 to 1.05 over 72 hours
        return latestSignupMultiplier + (cappedHours / 72) * (earliestSignupMultiplier - latestSignupMultiplier);
    }

    private applyMultipliers = (
        rrs: number,
        isFullEnchanted: boolean,
        isPriorityRole: boolean,
        isAlter: boolean,
        signedUpAt: Date,
        raidDateTime: Date
    ): RSSCalculatorOutput => {
        let modifiedRRS = rrs;
        const multipliers: Record<string, number> = {};

        const enchantMultiplier = isFullEnchanted ? FULL_ENCHANT_MULTIPLIER : 1;
        modifiedRRS *= enchantMultiplier;
        multipliers.fullEnchant = isFullEnchanted ? enchantMultiplier : 1;

        const priorityRoleMultiplier = isPriorityRole ? PRIORITY_ROLE_MULTIPLIER : 1;
        modifiedRRS *= priorityRoleMultiplier;
        multipliers.priorityRole = isPriorityRole ? priorityRoleMultiplier : 1;

        const alterMultiplier = isAlter ? ALTERS_PRIORITY_ROLE_MULTIPLIER : 1;
        modifiedRRS *= alterMultiplier;
        multipliers.alter = isAlter ? alterMultiplier : 1;

        const timingMultiplier = this.getSignupTimingMultiplier(signedUpAt, raidDateTime);
        modifiedRRS *= timingMultiplier;
        multipliers.signupTiming = timingMultiplier;

        return { rrs: modifiedRRS, multipliers };
    }

    calculateReadinessScore({ weeksSinceAccountCreation, raidReliabilityRating, isFullEnchanted, isPriorityRole, isAlter, signedUpAt, raidDateTime }: RSSCalculatorInput): RSSCalculatorOutput {
        const effectiveReliability = this.getEffectiveReliability(raidReliabilityRating, weeksSinceAccountCreation)

        return this.applyMultipliers(effectiveReliability, isFullEnchanted, isPriorityRole, isAlter, signedUpAt, raidDateTime)
    }
}