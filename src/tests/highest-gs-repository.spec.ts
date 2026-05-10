import { describe, expect, it, jest } from "@jest/globals";
import { HighestGSRepository } from "../infrastructure/repositories/highest-gs-repository";

describe("HighestGSRepository", () => {
    it("upserts using the deployed character_name unique constraint", async () => {
        const query: any = {
            upsert: jest.fn(() => query),
            select: jest.fn(() => query),
            maybeSingle: jest.fn(async () => ({
                data: {
                    character_name: "alveric",
                    realm_slug: "spineshatter",
                    created_at: "2026-01-01T00:00:00Z",
                    updated_at: "2026-01-01T00:00:00Z",
                    details: {
                        gs: 100,
                        hash: "hash",
                        color: "common",
                        isFullEnchanted: false,
                        isFullyGemmed: false,
                    },
                },
                error: null,
            })),
        };
        const databaseClient = {
            from: jest.fn(() => query),
        };
        const repository = new HighestGSRepository(databaseClient as any);

        await repository.saveHighestGS({
            characterName: " Alveric ",
            realmSlug: " Spineshatter ",
            createdAt: new Date("2026-01-01T00:00:00Z"),
            updatedAt: new Date("2026-01-01T00:00:00Z"),
            details: {
                gs: 100,
                hash: "hash",
                color: "common",
                isFullEnchanted: false,
                isFullyGemmed: false,
            },
        });

        expect(query.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                character_name: "alveric",
                character_realm: "spineshatter",
            }),
            { onConflict: "character_name,character_realm" }
        );
    });
});
