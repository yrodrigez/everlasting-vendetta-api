import { createRoute, RouteContext } from "@http/hono-adapter";
import { guildMemberMiddleware } from "@http/middleware/guild-member.middleware";
import { FindPredictionMarketByIdUseCase } from "@use-cases/evx/predictions/find-prediction-market-by-id.usecase";
import { FindPredictionMarketsUseCase } from "@use-cases/evx/predictions/find-prediction-markets.usecase";
import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod/v3";

const marketParamsSchema = z.object({
    marketId: z.string().uuid(),
});

type MarketParams = z.infer<typeof marketParamsSchema>;

export function buildFindPredictionMarketsRoute(
    findMarketsUseCase: FindPredictionMarketsUseCase,
    findMarketByIdUseCase: FindPredictionMarketByIdUseCase,
    authMiddleware: MiddlewareHandler
) {
    const findPredictionMarketsRoute = new Hono();

    findPredictionMarketsRoute.get(
        "/markets",
        authMiddleware,
        guildMemberMiddleware,
        createRoute({ functionName: "find-prediction-markets" }, async () => {
            const markets = await findMarketsUseCase.execute();

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
            async ({
                params,
            }: RouteContext<unknown, unknown, MarketParams>) => {
                const market = await findMarketByIdUseCase.execute(
                    params.marketId
                );

                return { market };
            }
        )
    );

    return findPredictionMarketsRoute;
}
