import { describe, expect, it, jest } from "@jest/globals";
import { Hono } from "hono";
import { CreatePredictionMarketUseCase } from "../application/use-cases/evx/predictions/create-prediction-market.usecase";
import {
    vxAdminMiddleware,
    guildMemberMiddleware,
} from "../infrastructure/http/middleware/guild-member.middleware";
import { PredictionMarketRepository } from "../infrastructure/repositories/evx/prediction-market-repository";
import { WalletRepository } from "../infrastructure/repositories/evx/wallet-repository";

const user = {
    userId: "00000000-0000-0000-0000-000000000001",
    roles: ["GUILD_MASTER"],
    permissions: [],
    provider: "discord_oauth" as const,
    isTemporal: false,
    isAdmin: false,
    isBanned: false,
    isGuildMember: true,
};

const vxAdmin = {
    userId: "00000000-0000-0000-0000-000000000002",
    roles: ["VX_ADMIN"],
    permissions: [],
    provider: "discord_oauth" as const,
    isTemporal: false,
    isAdmin: false,
    isBanned: false,
    isGuildMember: true,
};

type TestEnv = {
    Variables: {
        user: typeof user;
    };
};

describe("EVX guild middleware", () => {
    it("allows guild members", async () => {
        const app = new Hono<TestEnv>();
        app.use("*", async (context, next) => {
            context.set("user", user);
            await next();
        });
        app.get("/test", guildMemberMiddleware, (context) =>
            context.json({ ok: true })
        );

        const response = await app.request("/test");

        expect(response.status).toBe(200);
    });

    it("rejects non-guild members", async () => {
        const app = new Hono<TestEnv>();
        app.use("*", async (context, next) => {
            context.set("user", { ...user, isGuildMember: false });
            await next();
        });
        app.get("/test", guildMemberMiddleware, (context) =>
            context.json({ ok: true })
        );

        const response = await app.request("/test");

        expect(response.status).toBe(403);
    });

    it("requires the GUILD_MASTER role", async () => {
        const app = new Hono<TestEnv>();
        app.use("*", async (context, next) => {
            context.set("user", { ...user, roles: ["ADMIN"] });
            await next();
        });
        app.get("/test", vxAdminMiddleware, (context) =>
            context.json({ ok: true })
        );

        const response = await app.request("/test");

        expect(response.status).toBe(403);
    });
});

describe("PredictionMarketRepository", () => {
    it("auto-creates YES and NO outcomes for YES_NO markets", async () => {
        const query = jest.fn(async (...args: [string, unknown[]]) => {
            void args;

            return [
                {
                    id: "00000000-0000-0000-0000-000000000010",
                    reset_id: null,
                    title: "Will we clear the raid?",
                    description: null,
                    status: "DRAFT",
                    closes_at: "2026-06-01T00:00:00.000Z",
                    resolved_outcome_id: null,
                    created_by: user.userId,
                    created_at: "2026-05-01T00:00:00.000Z",
                    updated_at: "2026-05-01T00:00:00.000Z",
                    type: "YES_NO",
                    outcomes: [
                        {
                            id: "00000000-0000-0000-0000-000000000011",
                            market_id: "00000000-0000-0000-0000-000000000010",
                            label: "YES",
                            sort_order: 1,
                            created_at: "2026-05-01T00:00:00.000Z",
                        },
                        {
                            id: "00000000-0000-0000-0000-000000000012",
                            market_id: "00000000-0000-0000-0000-000000000010",
                            label: "NO",
                            sort_order: 2,
                            created_at: "2026-05-01T00:00:00.000Z",
                        },
                    ],
                },
            ];
        });
        const repository = new PredictionMarketRepository({ query } as any);

        const market = await repository.createMarket(
            {
                title: "Will we clear the raid?",
                closesAt: new Date("2026-06-01T00:00:00.000Z"),
                type: "YES_NO",
            },
            user.userId
        );

        expect(query).toHaveBeenCalledWith(expect.any(String), [
            null,
            "Will we clear the raid?",
            null,
            new Date("2026-06-01T00:00:00.000Z"),
            user.userId,
            "YES_NO",
            ["YES", "NO"],
            [1, 2],
        ]);
        expect(market.status).toBe("DRAFT");
        expect(market.outcomes.map((outcome) => outcome.label)).toEqual([
            "YES",
            "NO",
        ]);
    });

    it("does not query when a pledge is below the minimum amount", async () => {
        const query = jest.fn(async () => []);
        const repository = new PredictionMarketRepository({ query } as any);

        await expect(
            repository.createPledge({
                marketId: "00000000-0000-0000-0000-000000000010",
                outcomeId: "00000000-0000-0000-0000-000000000011",
                userId: user.userId,
                amount: 49,
            })
        ).rejects.toMatchObject({
            code: "PLEDGE_AMOUNT_TOO_LOW",
            statusCode: 400,
        });
        expect(query).not.toHaveBeenCalled();
    });

    it("maps pledge rejection reasons returned by SQL", async () => {
        const query = jest.fn(async () => [
            {
                id: null,
                market_id: null,
                outcome_id: null,
                wallet_id: null,
                amount: null,
                status: null,
                created_at: null,
                updated_at: null,
                wallet_balance_after: null,
                failure_reason: "Market is not open",
            },
        ]);
        const repository = new PredictionMarketRepository({ query } as any);

        await expect(
            repository.createPledge({
                marketId: "00000000-0000-0000-0000-000000000010",
                outcomeId: "00000000-0000-0000-0000-000000000011",
                userId: user.userId,
                amount: 50,
            })
        ).rejects.toMatchObject({ code: "MARKET_NOT_OPEN", statusCode: 400 });
    });

    it("maps markets with outcomes, pledges, and pool totals", async () => {
        const query = jest.fn(async () => [
            {
                id: "00000000-0000-0000-0000-000000000010",
                reset_id: null,
                title: "Will we clear the raid?",
                description: null,
                status: "OPEN",
                closes_at: "2026-06-01T00:00:00.000Z",
                resolved_outcome_id: null,
                created_by: user.userId,
                created_at: "2026-05-01T00:00:00.000Z",
                updated_at: "2026-05-01T00:00:00.000Z",
                type: "YES_NO",
                total_pool: 1000,
                pledge_count: 2,
                outcomes: [
                    {
                        id: "00000000-0000-0000-0000-000000000011",
                        market_id: "00000000-0000-0000-0000-000000000010",
                        label: "YES",
                        sort_order: 1,
                        created_at: "2026-05-01T00:00:00.000Z",
                        total_pledged: 300,
                        pledge_count: 1,
                        implied_probability: 0.3,
                    },
                    {
                        id: "00000000-0000-0000-0000-000000000012",
                        market_id: "00000000-0000-0000-0000-000000000010",
                        label: "NO",
                        sort_order: 2,
                        created_at: "2026-05-01T00:00:00.000Z",
                        total_pledged: 700,
                        pledge_count: 1,
                        implied_probability: 0.7,
                    },
                ],
                pledges: [
                    {
                        id: "00000000-0000-0000-0000-000000000020",
                        market_id: "00000000-0000-0000-0000-000000000010",
                        outcome_id: "00000000-0000-0000-0000-000000000011",
                        wallet_id: "00000000-0000-0000-0000-000000000030",
                        user_id: user.userId,
                        amount: 300,
                        status: "ACTIVE",
                        created_at: "2026-05-02T00:00:00.000Z",
                        updated_at: "2026-05-02T00:00:00.000Z",
                        market_title: "Will we clear the raid?",
                        market_status: "OPEN",
                        outcome_label: "YES",
                    },
                ],
            },
        ]);
        const repository = new PredictionMarketRepository({ query } as any);

        const markets = await repository.findMarkets();

        expect(markets[0].totalPool).toBe(1000);
        expect(markets[0].outcomes[0].impliedProbability).toBe(0.3);
        expect(markets[0].pledges[0].outcomeLabel).toBe("YES");
    });

    it("opens a market and returns the hydrated market", async () => {
        const query = jest
            .fn<any>()
            .mockResolvedValueOnce([
                {
                    market_id: "00000000-0000-0000-0000-000000000010",
                    failure_reason: null,
                },
            ])
            .mockResolvedValueOnce([marketDetailsRecord({ status: "OPEN" })]);
        const repository = new PredictionMarketRepository({ query } as any);

        const market = await repository.openMarket(
            "00000000-0000-0000-0000-000000000010"
        );

        expect(market.status).toBe("OPEN");
        expect(query.mock.calls[0][0]).toContain("set status = 'OPEN'");
    });

    it("finalizes a market through the payout SQL path", async () => {
        const query = jest
            .fn<any>()
            .mockResolvedValueOnce([
                {
                    market_id: "00000000-0000-0000-0000-000000000010",
                    failure_reason: null,
                },
            ])
            .mockResolvedValueOnce([
                marketDetailsRecord({
                    status: "RESOLVED",
                    resolved_outcome_id: "00000000-0000-0000-0000-000000000011",
                }),
            ]);
        const repository = new PredictionMarketRepository({ query } as any);

        const market = await repository.finalizeMarket({
            marketId: "00000000-0000-0000-0000-000000000010",
            resolvedOutcomeId: "00000000-0000-0000-0000-000000000011",
        });

        expect(market.status).toBe("RESOLVED");
        expect(query.mock.calls[0][0]).toContain("'PLEDGE_PAYOUT'");
        expect(query.mock.calls[0][0]).toContain("row_number() over");
    });

    it("cancels a market through the refund SQL path", async () => {
        const query = jest
            .fn<any>()
            .mockResolvedValueOnce([
                {
                    market_id: "00000000-0000-0000-0000-000000000010",
                    failure_reason: null,
                },
            ])
            .mockResolvedValueOnce([
                marketDetailsRecord({ status: "CANCELLED" }),
            ]);
        const repository = new PredictionMarketRepository({ query } as any);

        const market = await repository.cancelMarket(
            "00000000-0000-0000-0000-000000000010"
        );

        expect(market.status).toBe("CANCELLED");
        expect(query.mock.calls[0][0]).toContain("'PLEDGE_REFUND'");
    });

    it("maps lifecycle rejection reasons", async () => {
        const query = jest.fn(async () => [
            {
                market_id: null,
                failure_reason: "Market cannot be finalized",
            },
        ]);
        const repository = new PredictionMarketRepository({ query } as any);

        await expect(
            repository.finalizeMarket({
                marketId: "00000000-0000-0000-0000-000000000010",
                resolvedOutcomeId: "00000000-0000-0000-0000-000000000011",
            })
        ).rejects.toMatchObject({
            code: "MARKET_CANNOT_BE_FINALIZED",
            statusCode: 400,
        });
    });
});

function marketDetailsRecord(overrides: Record<string, unknown> = {}) {
    return {
        id: "00000000-0000-0000-0000-000000000010",
        reset_id: null,
        title: "Will we clear the raid?",
        description: null,
        status: "DRAFT",
        closes_at: "2026-06-01T00:00:00.000Z",
        resolved_outcome_id: null,
        created_by: user.userId,
        created_at: "2026-05-01T00:00:00.000Z",
        updated_at: "2026-05-01T00:00:00.000Z",
        type: "YES_NO",
        total_pool: 0,
        pledge_count: 0,
        outcomes: [],
        pledges: [],
        ...overrides,
    };
}

describe("CreatePredictionMarketUseCase", () => {
    it("requires custom outcomes for non-YES_NO markets", async () => {
        const repository = {
            createMarket: jest.fn(),
            createPledge: jest.fn(),
        };
        const usecase = new CreatePredictionMarketUseCase(repository as any);

        await expect(
            usecase.execute(
                {
                    title: "Which boss drops first?",
                    closesAt: new Date("2026-06-01T00:00:00.000Z"),
                    type: "MULTIPLE_CHOICE",
                    outcomes: ["Boss one"],
                },
                user.userId
            )
        ).rejects.toMatchObject({
            code: "PREDICTION_MARKET_OUTCOMES_REQUIRED",
            statusCode: 400,
        });
        expect(repository.createMarket).not.toHaveBeenCalled();
    });
});

describe("WalletRepository leaderboard", () => {
    it("maps leaderboard entries with selected character display data", async () => {
        const query = jest.fn(async (...args: [string, unknown[]]) => {
            void args;

            return [
                {
                    rank: "1",
                    user_id: user.userId,
                    wallet_id: "00000000-0000-0000-0000-000000000030",
                    selected_character_name: "Alveric",
                    selected_character_avatar: "/avatar.png",
                    balance: "7420",
                    total_pledged: "1800",
                    active_pledged: "300",
                    total_won: "600",
                    total_lost: "900",
                    total_refunded: "300",
                    net_profit: "2420",
                    markets_won: "4",
                    markets_lost: "2",
                    pledge_count: "9",
                },
            ];
        });
        const repository = new WalletRepository({ query } as any);

        const leaderboard = await repository.findLeaderboard();

        expect(query.mock.calls[0][0]).toContain(
            "selected_member.character->>'name'"
        );
        expect(query.mock.calls[0][0]).toContain(
            "selected_member.character->>'avatar'"
        );
        expect(leaderboard[0]).toMatchObject({
            rank: 1,
            userId: user.userId,
            selectedCharacterName: "Alveric",
            selectedCharacterAvatar: "/avatar.png",
            balance: 7420,
            netProfit: 2420,
        });
    });
});
