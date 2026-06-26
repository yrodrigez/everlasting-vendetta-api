import { describe, expect, it, jest } from "@jest/globals";
import { GearScoreResolver } from "../application/services/gear-score/gear-score-resolver";

const enchantedEquipment = [
    {
        itemId: 1,
        inventoryType: "INVTYPE_HEAD",
        isEnchanted: true,
        qualityType: "EPIC",
        fetchUrl: "",
        gems: [],
        sockets: [],
    },
];

describe("GearScoreResolver", () => {
    it("returns stored highest GS when it is higher than the current cached GS", async () => {
        const highestGSPort = {
            getHighestGS: jest.fn(async () => ({
                characterName: "mage",
                realmSlug: "living-flame",
                createdAt: new Date("2026-01-01T00:00:00Z"),
                updatedAt: new Date("2026-01-01T00:00:00Z"),
                details: {
                    gs: 250,
                    hash: "highest-hash",
                    color: "rare" as const,
                    isFullEnchanted: true,
                    isFullyGemmed: true,
                },
            })),
            saveHighestGS: jest.fn(),
        };
        const resolver = new GearScoreResolver(
            {
                getByHash: jest.fn(async () => ({
                    score: 100,
                    color: "common" as const,
                })),
                save: jest.fn(),
            } as any,
            {
                getItem: jest.fn(async () => ({
                    itemLevel: 100,
                    quality: {
                        type: "EPIC",
                        name: "Epic",
                    },
                    icon: "icon.jpg",
                    displayId: 1,
                    id: 1,
                    name: "Item",
                    sockets: [],
                })),
            } as any,
            highestGSPort as any
        );

        const result = await resolver.resolve({
            characterName: "Mage",
            realmSlug: "Living-Flame",
            equippedItems: enchantedEquipment,
        });

        expect(result.score).toBe(250);
        expect(result.hash).toBe("highest-hash");
        expect(result.isFullEnchanted).toBe(true);
        expect(highestGSPort.saveHighestGS).not.toHaveBeenCalled();
    });

    it("upserts current GS when it is at least the stored highest GS", async () => {
        const highestGSPort = {
            getHighestGS: jest.fn(async () => ({
                characterName: "mage",
                realmSlug: "living-flame",
                createdAt: new Date("2026-01-01T00:00:00Z"),
                updatedAt: new Date("2026-01-01T00:00:00Z"),
                details: {
                    gs: 100,
                    hash: "old-hash",
                    color: "common" as const,
                    isFullEnchanted: false,
                },
            })),
            saveHighestGS: jest.fn(async (gs: unknown) => gs),
        };
        const resolver = new GearScoreResolver(
            {
                getByHash: jest.fn(async () => ({
                    score: 200,
                    color: "uncommon" as const,
                })),
                save: jest.fn(),
            } as any,
            {
                getItem: jest.fn(async () => ({
                    itemLevel: 100,
                    quality: {
                        type: "EPIC",
                        name: "Epic",
                    },
                    icon: "icon.jpg",
                    displayId: 1,
                    id: 1,
                    name: "Item",
                    sockets: [],
                })),
            } as any,
            highestGSPort as any
        );

        const result = await resolver.resolve({
            characterName: " Mage ",
            realmSlug: " Living-Flame ",
            equippedItems: enchantedEquipment,
        });

        expect(result.score).toBe(200);
        expect(highestGSPort.getHighestGS as jest.Mock).toHaveBeenCalledWith(
            " Mage ",
            " Living-Flame ",
            undefined
        );
        expect(highestGSPort.saveHighestGS).toHaveBeenCalledWith(
            expect.objectContaining({
                characterName: "mage",
                realmSlug: "living-flame",
                details: expect.objectContaining({
                    gs: 200,
                    color: "uncommon",
                    isFullEnchanted: true,
                }),
            })
        );
    });

    it("passes force refresh to the highest GS lookup", async () => {
        const highestGSPort = {
            getHighestGS: jest.fn(async () => null),
            saveHighestGS: jest.fn(async (gs: unknown) => gs),
        };
        const resolver = new GearScoreResolver(
            {
                getByHash: jest.fn(async () => ({
                    score: 200,
                    color: "uncommon" as const,
                })),
                save: jest.fn(),
            } as any,
            {
                getItem: jest.fn(async () => ({
                    itemLevel: 100,
                    quality: {
                        type: "EPIC",
                        name: "Epic",
                    },
                    icon: "icon.jpg",
                    displayId: 1,
                    id: 1,
                    name: "Item",
                    sockets: [],
                })),
            } as any,
            highestGSPort as any
        );

        await resolver.resolve({
            characterName: "Mage",
            realmSlug: "Living-Flame",
            equippedItems: enchantedEquipment,
            forceRefresh: true,
        });

        expect(highestGSPort.getHighestGS as jest.Mock).toHaveBeenCalledWith(
            "Mage",
            "Living-Flame",
            true
        );
    });
});
