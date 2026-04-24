import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { CalculateResetRaidReadinessScoreUseCaseFactory } from "@infrastructure/factories/raid/calculate-reset-raid-readiness-score-usecase-factory";
import { Hono } from "hono";
import { z } from "zod/v3";

const resetRrsParamsSchema = z.object({
    id: z.string().min(1),
});

type ResetRrsParams = z.infer<typeof resetRrsParamsSchema>;

const calculateResetRaidReadinessScoreRoute = new Hono();

calculateResetRaidReadinessScoreRoute.post(
    "/:id/rrs",
    authMiddleware,
    createRoute<unknown, unknown, unknown, ResetRrsParams>(
        {
            functionName: "calculate-reset-raid-readiness-score",
            paramsSchema: resetRrsParamsSchema,
        },
        async ({ params }) => {
            const useCase =
                CalculateResetRaidReadinessScoreUseCaseFactory.make();
            return useCase.execute({ resetId: params.id });
        }
    )
);

export { calculateResetRaidReadinessScoreRoute };
