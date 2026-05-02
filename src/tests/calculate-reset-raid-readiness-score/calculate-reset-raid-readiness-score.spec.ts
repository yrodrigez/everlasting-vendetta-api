import { describe, expect, it, jest } from "@jest/globals";
import { CalculateResetRaidReadinessScoreUseCase } from "../../application/use-cases/calculate-reset-raid-readiness-score.usecase";

jest.mock("p-limit", () => ({
    __esModule: true,
    default: () => async (fn: () => Promise<unknown>) => fn(),
}));

describe("CalculateResetRaidReadinessScoreUseCase", () => {
    it("treats participants missing from the guild roster as non-priority non-alters", async () => {
        const participant = {
            characterId: 102,
            participationCreatedAt: new Date("2026-01-01T00:00:00Z"),
            resetId: "reset-1",
            isConfirmed: true,
            participationUpdatedAt: new Date("2026-01-01T00:00:00Z"),
            details: {
                role: "dps" as const,
                status: "confirmed" as const,
                className: "mage" as const,
                rss: 0,
            },
            character: {
                name: "Unguildedcharacter",
                realmSlug: "living-flame",
                createdAt: new Date("2025-01-01T00:00:00Z"),
                userId: "user-2",
            },
        };

        const rrsCalculator: any = {
            calculateReadinessScore: jest.fn(() => ({
                rrs: 70,
                multipliers: { signupTiming: 1.05 },
            })),
        };
        const accessTokenKey = "access_token";
        const useCase = new CalculateResetRaidReadinessScoreUseCase(
            {
                getResetCreatedBy: jest.fn(async () => ({
                    id: "reset-1",
                    raidDate: "2026-01-05",
                    time: "19:00:00",
                    createdBy: {
                        id: 1,
                        name: "Creator",
                        realmSlug: "living-flame",
                    },
                })),
            } as any,
            {
                fetchEquipment: jest.fn(async () => ({
                    characterName: "Unguildedcharacter",
                    equippedItems: [],
                })),
            } as any,
            {
                getCharacterReliability: jest.fn(),
                getMultipleCharactersReliability: jest.fn(async () => [
                    {
                        characterName: "Unguildedcharacter",
                        realmSlug: "living-flame",
                        finalRecentReliability: 70,
                        coverageScore: 0.7,
                        weightedWeeklyScore: 3,
                        weeksConsidered: 4,
                        opportunitiesConsidered: 5,
                    },
                ]),
            } as any,
            {
                getParticipantsByResetId: jest.fn(async () => [participant]),
                updateParticipant: jest.fn(async () => undefined),
            } as any,
            rrsCalculator,
            {
                getCurrentToken: jest.fn(async () => ({
                    [accessTokenKey]: "token",
                })),
                saveToken: jest.fn(),
                createNewToken: jest.fn(),
            } as any,
            {
                getGuildRoster: jest.fn(async () => ({
                    members: [],
                })),
            } as any,
            {
                getUserRegistrationWeeks: jest.fn(async () => ({
                    userId: "user-2",
                    registeredAt: new Date("2025-01-01T00:00:00Z"),
                    weeksSinceRegistration: 8,
                    characterName: "Unguildedcharacter",
                })),
            } as any,
            {
                getHighestGS: jest.fn(async () => ({
                    details: { isFullEnchanted: true },
                })),
                saveHighestGS: jest.fn(),
            } as any,
            {
                resolve: jest.fn(),
            } as any
        );

        const result = await useCase.execute({ resetId: "reset-1" });

        expect(rrsCalculator.calculateReadinessScore).toHaveBeenCalledWith(
            expect.objectContaining({
                isPriorityRole: false,
                isAlter: false,
            })
        );
        expect(result.participantScores[0]).toEqual(
            expect.objectContaining({
                characterName: "Unguildedcharacter",
                isPriorityRole: false,
                isAlter: false,
            })
        );
    });

    it("fetches the guild roster once using the reset creator realm", async () => {
        const participants = [
            {
                characterId: 201,
                participationCreatedAt: new Date("2026-01-01T00:00:00Z"),
                resetId: "reset-spineshatter",
                isConfirmed: true,
                participationUpdatedAt: new Date("2026-01-01T00:00:00Z"),
                details: {
                    role: "dps" as const,
                    status: "confirmed" as const,
                    className: "mage" as const,
                    rss: 0,
                },
                character: {
                    name: "Firstcharacter",
                    realmSlug: "spineshatter",
                    createdAt: new Date("2025-01-01T00:00:00Z"),
                    userId: "user-1",
                },
            },
            {
                characterId: 202,
                participationCreatedAt: new Date("2026-01-01T00:00:00Z"),
                resetId: "reset-spineshatter",
                isConfirmed: true,
                participationUpdatedAt: new Date("2026-01-01T00:00:00Z"),
                details: {
                    role: "dps" as const,
                    status: "confirmed" as const,
                    className: "mage" as const,
                    rss: 0,
                },
                character: {
                    name: "Secondcharacter",
                    realmSlug: "living-flame",
                    createdAt: new Date("2025-01-01T00:00:00Z"),
                    userId: "user-2",
                },
            },
        ];
        const wowGuildService: any = {
            getGuildRoster: jest.fn(async () => ({ members: [] })),
        };
        const accessTokenKey = "access_token";

        const useCase = new CalculateResetRaidReadinessScoreUseCase(
            {
                getResetCreatedBy: jest.fn(async () => ({
                    id: "reset-spineshatter",
                    raidDate: "2026-01-05",
                    time: "19:00:00",
                    createdBy: {
                        id: 1,
                        name: "Creator",
                        realmSlug: "spineshatter",
                    },
                })),
            } as any,
            {
                fetchEquipment: jest.fn(async () => ({
                    characterName: "character",
                    equippedItems: [],
                })),
            } as any,
            {
                getCharacterReliability: jest.fn(),
                getMultipleCharactersReliability: jest.fn(async () => []),
            } as any,
            {
                getParticipantsByResetId: jest.fn(async () => participants),
                updateParticipant: jest.fn(async () => undefined),
            } as any,
            {
                calculateReadinessScore: jest.fn(() => ({
                    rrs: 1,
                    multipliers: {},
                })),
            } as any,
            {
                getCurrentToken: jest.fn(async () => ({
                    [accessTokenKey]: "token",
                })),
                saveToken: jest.fn(),
                createNewToken: jest.fn(),
            } as any,
            wowGuildService,
            {
                getUserRegistrationWeeks: jest.fn(async () => ({
                    userId: "user-1",
                    registeredAt: new Date("2025-01-01T00:00:00Z"),
                    weeksSinceRegistration: 8,
                    characterName: "Firstcharacter",
                })),
            } as any,
            {
                getHighestGS: jest.fn(async () => ({
                    details: { isFullEnchanted: true },
                })),
                saveHighestGS: jest.fn(),
            } as any,
            {
                resolve: jest.fn(),
            } as any
        );

        await useCase.execute({ resetId: "reset-spineshatter" });

        expect(wowGuildService.getGuildRoster).toHaveBeenCalledTimes(1);
        expect(wowGuildService.getGuildRoster).toHaveBeenCalledWith(
            "spineshatter",
            "everlasting-vendetta",
            "token"
        );
    });

    it("uses fully enchanted highest GS without fetching current equipment", async () => {
        const participant = {
            characterId: 301,
            participationCreatedAt: new Date("2026-01-01T00:00:00Z"),
            resetId: "reset-highest-enchanted",
            isConfirmed: true,
            participationUpdatedAt: new Date("2026-01-01T00:00:00Z"),
            details: {
                role: "dps" as const,
                status: "confirmed" as const,
                className: "mage" as const,
                rss: 0,
            },
            character: {
                name: "Enchantedmage",
                realmSlug: "living-flame",
                createdAt: new Date("2025-01-01T00:00:00Z"),
                userId: "user-3",
            },
        };
        const equipmentService = {
            fetchEquipment: jest.fn(),
        };
        const rrsCalculator: any = {
            calculateReadinessScore: jest.fn(() => ({
                rrs: 70,
                multipliers: {},
            })),
        };

        const useCase = new CalculateResetRaidReadinessScoreUseCase(
            {
                getResetCreatedBy: jest.fn(async () => ({
                    id: "reset-highest-enchanted",
                    raidDate: "2026-01-05",
                    time: "19:00:00",
                    createdBy: {
                        id: 1,
                        name: "Creator",
                        realmSlug: "living-flame",
                    },
                })),
            } as any,
            equipmentService as any,
            {
                getMultipleCharactersReliability: jest.fn(async () => [
                    {
                        characterName: "Enchantedmage",
                        realmSlug: "living-flame",
                        finalRecentReliability: 70,
                        coverageScore: 0.7,
                        weightedWeeklyScore: 3,
                        weeksConsidered: 4,
                        opportunitiesConsidered: 5,
                    },
                ]),
            } as any,
            {
                getParticipantsByResetId: jest.fn(async () => [participant]),
            } as any,
            rrsCalculator,
            {
                getCurrentToken: jest.fn(async () => ({
                    access_token: "token",
                })),
            } as any,
            {
                getGuildRoster: jest.fn(async () => ({ members: [] })),
            } as any,
            {
                getUserRegistrationWeeks: jest.fn(async () => ({
                    weeksSinceRegistration: 8,
                })),
            } as any,
            {
                getHighestGS: jest.fn(async () => ({
                    details: { isFullEnchanted: true, isFullyGemmed: true },
                })),
            } as any,
            {
                resolve: jest.fn(),
            } as any
        );

        await useCase.execute({ resetId: "reset-highest-enchanted" });

        expect(equipmentService.fetchEquipment).not.toHaveBeenCalled();
        expect(rrsCalculator.calculateReadinessScore).toHaveBeenCalledWith(
            expect.objectContaining({ isFullEnchanted: true })
        );
    });

    it("fetches current equipment when highest GS is not fully enchanted", async () => {
        const participant = {
            characterId: 302,
            participationCreatedAt: new Date("2026-01-01T00:00:00Z"),
            resetId: "reset-current-enchanted",
            isConfirmed: true,
            participationUpdatedAt: new Date("2026-01-01T00:00:00Z"),
            details: {
                role: "dps" as const,
                status: "confirmed" as const,
                className: "mage" as const,
                rss: 0,
            },
            character: {
                name: "Currentmage",
                realmSlug: "living-flame",
                createdAt: new Date("2025-01-01T00:00:00Z"),
                userId: "user-4",
            },
        };
        const equipment = {
            characterName: "Currentmage",
            characterClass: "MAGE",
            equippedItems: [
                {
                    itemId: 1,
                    inventoryType: "INVTYPE_HEAD",
                    isEnchanted: true,
                    qualityType: "EPIC",
                    fetchUrl: "",
                    gems: [],
                    sockets: [],
                },
            ],
        };
        const equipmentService = {
            fetchEquipment: jest.fn(async () => equipment),
        };
        const gearScoreResolver = {
            resolve: jest.fn(async () => ({
                characterName: "currentmage",
                score: 100,
                color: "common",
                hash: "hash",
                isFullEnchanted: true,
            })),
        };
        const rrsCalculator: any = {
            calculateReadinessScore: jest.fn(() => ({
                rrs: 70,
                multipliers: {},
            })),
        };

        const useCase = new CalculateResetRaidReadinessScoreUseCase(
            {
                getResetCreatedBy: jest.fn(async () => ({
                    id: "reset-current-enchanted",
                    raidDate: "2026-01-05",
                    time: "19:00:00",
                    createdBy: {
                        id: 1,
                        name: "Creator",
                        realmSlug: "living-flame",
                    },
                })),
            } as any,
            equipmentService as any,
            {
                getMultipleCharactersReliability: jest.fn(async () => [
                    {
                        characterName: "Currentmage",
                        realmSlug: "living-flame",
                        finalRecentReliability: 70,
                        coverageScore: 0.7,
                        weightedWeeklyScore: 3,
                        weeksConsidered: 4,
                        opportunitiesConsidered: 5,
                    },
                ]),
            } as any,
            {
                getParticipantsByResetId: jest.fn(async () => [participant]),
            } as any,
            rrsCalculator,
            {
                getCurrentToken: jest.fn(async () => ({
                    access_token: "token",
                })),
            } as any,
            {
                getGuildRoster: jest.fn(async () => ({ members: [] })),
            } as any,
            {
                getUserRegistrationWeeks: jest.fn(async () => ({
                    weeksSinceRegistration: 8,
                })),
            } as any,
            {
                getHighestGS: jest.fn(async () => ({
                    details: { isFullEnchanted: false },
                })),
            } as any,
            gearScoreResolver as any
        );

        await useCase.execute({ resetId: "reset-current-enchanted" });

        expect(
            equipmentService.fetchEquipment as jest.Mock
        ).toHaveBeenCalledWith("currentmage", "living-flame", "token");
        expect(gearScoreResolver.resolve as jest.Mock).toHaveBeenCalledWith(
            expect.objectContaining({
                characterName: "Currentmage",
                realmSlug: "living-flame",
                equippedItems: equipment.equippedItems,
            })
        );
        expect(rrsCalculator.calculateReadinessScore).toHaveBeenCalledWith(
            expect.objectContaining({ isFullEnchanted: true })
        );
    });
});
