import { createRoute, RouteContext } from "@http/hono-adapter";
import {
    vxAdminMiddleware,
    guildMemberMiddleware,
} from "@http/middleware/guild-member.middleware";
import { CancelPredictionMarketUseCase } from "@use-cases/evx/predictions/cancel-prediction-market.usecase";
import { FinalizePredictionMarketUseCase } from "@use-cases/evx/predictions/finalize-prediction-market.usecase";
import { OpenPredictionMarketUseCase } from "@use-cases/evx/predictions/open-prediction-market.usecase";
import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod/v3";

const marketParamsSchema = z.object({
    marketId: z.string().uuid(),
});

const finalizeMarketSchema = z.object({
    resolvedOutcomeId: z.string().uuid(),
});

type MarketParams = z.infer<typeof marketParamsSchema>;
type FinalizeMarketInput = z.infer<typeof finalizeMarketSchema>;

export function buildPredictionMarketLifecycleRoute(
    openUseCase: OpenPredictionMarketUseCase,
    finalizeUseCase: FinalizePredictionMarketUseCase,
    cancelUseCase: CancelPredictionMarketUseCase,
    authMiddleware: MiddlewareHandler
) {
    const predictionMarketLifecycleRoute = new Hono();

    predictionMarketLifecycleRoute.patch(
        "/markets/:marketId/open",
        authMiddleware,
        guildMemberMiddleware,
        vxAdminMiddleware,
        createRoute<unknown, unknown, unknown, MarketParams>(
            {
                functionName: "open-prediction-market",
                paramsSchema: marketParamsSchema,
            },
            async ({
                params,
            }: RouteContext<unknown, unknown, MarketParams>) => {
                const market = await openUseCase.execute(params.marketId);

                return { market };
            }
        )
    );

    predictionMarketLifecycleRoute.post(
        "/markets/:marketId/finalize",
        authMiddleware,
        guildMemberMiddleware,
        vxAdminMiddleware,
        createRoute<FinalizeMarketInput, unknown, unknown, MarketParams>(
            {
                functionName: "finalize-prediction-market",
                inputSchema: finalizeMarketSchema,
                paramsSchema: marketParamsSchema,
            },
            async ({
                input,
                params,
            }: RouteContext<FinalizeMarketInput, unknown, MarketParams>) => {
                const market = await finalizeUseCase.execute({
                    marketId: params.marketId,
                    resolvedOutcomeId: input.resolvedOutcomeId,
                });

                return { market };
            }
        )
    );

    predictionMarketLifecycleRoute.post(
        "/markets/:marketId/cancel",
        authMiddleware,
        guildMemberMiddleware,
        vxAdminMiddleware,
        createRoute<unknown, unknown, unknown, MarketParams>(
            {
                functionName: "cancel-prediction-market",
                paramsSchema: marketParamsSchema,
            },
            async ({
                params,
            }: RouteContext<unknown, unknown, MarketParams>) => {
                const market = await cancelUseCase.execute(params.marketId);

                return { market };
            }
        )
    );

    return predictionMarketLifecycleRoute;
}
