import { createRoute, RouteContext } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { guildMemberMiddleware } from "@http/middleware/guild-member.middleware";
import { evxContainer } from "@infrastructure/di/evx/evx.container";
import { FindPredictionMarketByIdUseCase } from "@use-cases/evx/predictions/find-prediction-market-by-id.usecase";
import { FindPredictionMarketsUseCase } from "@use-cases/evx/predictions/find-prediction-markets.usecase";
import { Hono } from "hono";
import { z } from "zod/v3";

const marketParamsSchema = z.object({
    marketId: z.string().uuid(),
});

type MarketParams = z.infer<typeof marketParamsSchema>;

const findPredictionMarketsRoute = new Hono();

findPredictionMarketsRoute.get(
    "/markets",
    authMiddleware,
    guildMemberMiddleware,
    createRoute({ functionName: "find-prediction-markets" }, async () => {
        const usecase = evxContainer.resolve<FindPredictionMarketsUseCase>(
            "FindPredictionMarketsUseCase"
        );
        const markets = await usecase.execute();

        return { markets };
    })
);

findPredictionMarketsRoute.get(
    "/markets/:marketId",
    authMiddleware,
    guildMemberMiddleware,
    createRoute<unknown, unknown, unknown, MarketParams>(
        {
            functionName: "find-prediction-market-by-id",
            paramsSchema: marketParamsSchema,
        },
        async ({ params }: RouteContext<unknown, unknown, MarketParams>) => {
            const usecase =
                evxContainer.resolve<FindPredictionMarketByIdUseCase>(
                    "FindPredictionMarketByIdUseCase"
                );
            const market = await usecase.execute(params.marketId);

            return { market };
        }
    )
);

export { findPredictionMarketsRoute };
