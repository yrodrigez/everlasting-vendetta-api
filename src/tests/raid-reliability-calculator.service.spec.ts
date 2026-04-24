import { describe, expect, it } from "@jest/globals";
import { RaidReadinessScoreCalculatorService } from "../../src/infrastructure/services/raid-reliability-calculator.service";

describe("RaidReadinessScoreCalculatorService", () => {
    const calculator = new RaidReadinessScoreCalculatorService();

    it("gives full credit (1.05) if signed up 72+ hours before raid", () => {
        const raidDateTime = new Date("2026-01-05T19:00:00Z");
        const signedUpAt = new Date("2026-01-02T19:00:00Z"); // Exactly 72 hours
        
        const result = calculator.calculateReadinessScore({
            characterName: "Test",
            realmSlug: "realm",
            weeksSinceAccountCreation: 5,
            raidReliabilityRating: 100,
            isFullEnchanted: false,
            isPriorityRole: false,
            isAlter: false,
            signedUpAt,
            raidDateTime
        });

        expect(result.multipliers.signupTiming).toBe(1.05);
    });

    it("gives base credit (0.88) if signed up exactly at raid time", () => {
        const raidDateTime = new Date("2026-01-05T19:00:00Z");
        const signedUpAt = new Date("2026-01-05T19:00:00Z"); // 0 hours
        
        const result = calculator.calculateReadinessScore({
            characterName: "Test",
            realmSlug: "realm",
            weeksSinceAccountCreation: 5,
            raidReliabilityRating: 100,
            isFullEnchanted: false,
            isPriorityRole: false,
            isAlter: false,
            signedUpAt,
            raidDateTime
        });

        expect(result.multipliers.signupTiming).toBe(0.88);
    });

    it("scales linearly between 0 and 72 hours", () => {
        const raidDateTime = new Date("2026-01-05T19:00:00Z");
        const signedUpAt = new Date("2026-01-04T07:00:00Z"); // 36 hours before (halfway)
        
        const result = calculator.calculateReadinessScore({
            characterName: "Test",
            realmSlug: "realm",
            weeksSinceAccountCreation: 5,
            raidReliabilityRating: 100,
            isFullEnchanted: false,
            isPriorityRole: false,
            isAlter: false,
            signedUpAt,
            raidDateTime
        });

        expect(result.multipliers.signupTiming).toBeCloseTo(0.965); // 0.88 + (0.5 * 0.17) = 0.965
    });

    it("caps credit at 1.05 if signed up more than 72 hours before", () => {
        const raidDateTime = new Date("2026-01-05T19:00:00Z");
        const signedUpAt = new Date("2025-12-01T19:00:00Z"); // 1 month before
        
        const result = calculator.calculateReadinessScore({
            characterName: "Test",
            realmSlug: "realm",
            weeksSinceAccountCreation: 5,
            raidReliabilityRating: 100,
            isFullEnchanted: false,
            isPriorityRole: false,
            isAlter: false,
            signedUpAt,
            raidDateTime
        });

        expect(result.multipliers.signupTiming).toBe(1.05);
    });

    it("does not go below 0.88 if signed up after raid started", () => {
        const raidDateTime = new Date("2026-01-05T19:00:00Z");
        const signedUpAt = new Date("2026-01-05T20:00:00Z"); // 1 hour after
        
        const result = calculator.calculateReadinessScore({
            characterName: "Test",
            realmSlug: "realm",
            weeksSinceAccountCreation: 5,
            raidReliabilityRating: 100,
            isFullEnchanted: false,
            isPriorityRole: false,
            isAlter: false,
            signedUpAt,
            raidDateTime
        });

        expect(result.multipliers.signupTiming).toBe(0.88);
    });
});