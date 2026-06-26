import { describe, expect, it, jest } from "@jest/globals";
import { HighestGSRepository } from "../infrastructure/repositories/highest-gs-repository";

describe("HighestGSRepository", () => {
    it("returns cached highest GS from Redis without querying the database", async () => {
        const cached = {
            characterName: "alveric",
            realmSlug: "spineshatter",
            createdAt: "2026-01-01T00:00:00Z" as unknown as Date,
            updatedAt: "2026-01-02T00:00:00Z" as unknown as Date,
            details: {
                gs: 123,
                hash: "cached-hash",
                color: "rare" as const,
                isFullEnchanted: true,
                isFullyGemmed: true,
            },
        };
        const store: any = {
            get: jest.fn(async () => cached),
            set: jest.fn(),
            remove: jest.fn(),
        };
        const databaseClient = {
            from: jest.fn(),
        };
        const repository = new HighestGSRepository(
            databaseClient as any,
            store as any
        );

        const result = await repository.getHighestGS(
            " Alveric ",
            " Spineshatter "
        );

        expect(result).toEqual({
            ...cached,
            createdAt: new Date("2026-01-01T00:00:00Z"),
            updatedAt: new Date("2026-01-02T00:00:00Z"),
        });
        expect(store.get).toHaveBeenCalledWith(
            "highest-gs:spineshatter:alveric"
        );
        expect(databaseClient.from).not.toHaveBeenCalled();
    });

    it("bypasses Redis cache on force refresh and refreshes it from the database", async () => {
        const query: any = {
            select: jest.fn(() => query),
            eq: jest.fn(() => query),
            maybeSingle: jest.fn(async () => ({
                data: {
                    character_name: "alveric",
                    realm_slug: "spineshatter",
                    created_at: "2026-01-01T00:00:00Z",
                    updated_at: "2026-01-02T00:00:00Z",
                    details: {
                        gs: 234,
                        hash: "db-hash",
                        color: "epic",
                        isFullEnchanted: true,
                        isFullyGemmed: true,
                    },
                },
                error: null,
            })),
        };
        const store: any = {
            get: jest.fn(async () => ({
                characterName: "alveric",
                realmSlug: "spineshatter",
                createdAt: "2026-01-01T00:00:00Z" as unknown as Date,
                updatedAt: "2026-01-01T00:00:00Z" as unknown as Date,
                details: {
                    gs: 999,
                    hash: "cached-hash",
                    color: "legendary" as const,
                    isFullEnchanted: true,
                    isFullyGemmed: true,
                },
            })),
            set: jest.fn(),
            remove: jest.fn(),
        };
        const databaseClient = {
            from: jest.fn(() => query),
        };
        const repository = new HighestGSRepository(
            databaseClient as any,
            store as any
        );

        const result = await repository.getHighestGS(
            "Alveric",
            "Spineshatter",
            true
        );

        expect(result?.details.gs).toBe(234);
        expect(store.get).not.toHaveBeenCalled();
        expect(store.set).toHaveBeenCalledWith(
            "highest-gs:spineshatter:alveric",
            expect.objectContaining({
                characterName: "alveric",
                realmSlug: "spineshatter",
            }),
            300
        );
    });

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
        const store: any = {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
        };
        const repository = new HighestGSRepository(
            databaseClient as any,
            store as any
        );

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
        expect(store.set).toHaveBeenCalledWith(
            "highest-gs:spineshatter:alveric",
            expect.objectContaining({
                characterName: "alveric",
                realmSlug: "spineshatter",
            }),
            300
        );
    });
});
