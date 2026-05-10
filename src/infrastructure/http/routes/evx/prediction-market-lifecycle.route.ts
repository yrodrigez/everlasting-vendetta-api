import { createRoute, RouteContext } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import {
    guildMasterMiddleware,
    guildMemberMiddleware,
} from "@http/middleware/guild-member.middleware";
import { evxContainer } from "@infrastructure/di/evx/evx.container";
import { CancelPredictionMarketUseCase } from "@use-cases/evx/predictions/cancel-prediction-market.usecase";
import { FinalizePredictionMarketUseCase } from "@use-cases/evx/predictions/finalize-prediction-market.usecase";
import { OpenPredictionMarketUseCase } from "@use-cases/evx/predictions/open-prediction-market.usecase";
import { Hono } from "hono";
import { z } from "zod/v3";

const marketParamsSchema = z.object({
    marketId: z.string().uuid(),
});

const finalizeMarketSchema = z.object({
    resolvedOutcomeId: z.string().uuid(),
});

type MarketParams = z.infer<typeof marketParamsSchema>;
type FinalizeMarketInput = z.infer<typeof finalizeMarketSchema>;

const predictionMarketLifecycleRoute = new Hono();

predictionMarketLifecycleRoute.patch(
    "/markets/:marketId/open",
    authMiddleware,
    guildMemberMiddleware,
    guildMasterMiddleware,
    createRoute<unknown, unknown, unknown, MarketParams>(
        {
            functionName: "open-prediction-market",
            paramsSchema: marketParamsSchema,
        },
        async ({ params }: RouteContext<unknown, unknown, MarketParams>) => {
            const usecase = evxContainer.resolve<OpenPredictionMarketUseCase>(
                "OpenPredictionMarketUseCase"
            );
            const market = await usecase.execute(params.marketId);

            return { market };
        }
    )
);

predictionMarketLifecycleRoute.post(
    "/markets/:marketId/finalize",
    authMiddleware,
    guildMemberMiddleware,
    guildMasterMiddleware,
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
            const usecase =
                evxContainer.resolve<FinalizePredictionMarketUseCase>(
                    "FinalizePredictionMarketUseCase"
                );
            const market = await usecase.execute({
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
    guildMasterMiddleware,
    createRoute<unknown, unknown, unknown, MarketParams>(
        {
            functionName: "cancel-prediction-market",
            paramsSchema: marketParamsSchema,
        },
        async ({ params }: RouteContext<unknown, unknown, MarketParams>) => {
            const usecase = evxContainer.resolve<CancelPredictionMarketUseCase>(
                "CancelPredictionMarketUseCase"
            );
            const market = await usecase.execute(params.marketId);

            return { market };
        }
    )
);

export { predictionMarketLifecycleRoute };
