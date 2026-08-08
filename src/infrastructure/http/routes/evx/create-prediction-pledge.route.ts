import { createRoute, RouteContext } from "@http/hono-adapter";
import { guildMemberMiddleware } from "@http/middleware/guild-member.middleware";
import { CreatePredictionPledgeUseCase } from "@use-cases/evx/predictions/create-prediction-pledge.usecase";
import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod/v3";

const createPredictionPledgeParamsSchema = z.object({
    marketId: z.string().uuid(),
});

const createPredictionPledgeSchema = z.object({
    outcomeId: z.string().uuid(),
    amount: z.number().int().min(50).max(1000),
});

type CreatePredictionPledgeParams = z.infer<
    typeof createPredictionPledgeParamsSchema
>;
type CreatePredictionPledgeInput = z.infer<typeof createPredictionPledgeSchema>;

export function buildCreatePredictionPledgeRoute(
    useCase: CreatePredictionPledgeUseCase,
    authMiddleware: MiddlewareHandler
) {
    const createPredictionPledgeRoute = new Hono();

    createPredictionPledgeRoute.post(
        "/markets/:marketId/pledges",
        authMiddleware,
        guildMemberMiddleware,
        createRoute<
            CreatePredictionPledgeInput,
            unknown,
            unknown,
            CreatePredictionPledgeParams
        >(
            {
                functionName: "create-prediction-pledge",
                inputSchema: createPredictionPledgeSchema,
                paramsSchema: createPredictionPledgeParamsSchema,
            },
            async ({
                input,
                params,
                user,
            }: RouteContext<
                CreatePredictionPledgeInput,
                unknown,
                CreatePredictionPledgeParams
            >) => {
                if (!user) {
                    return {
                        status: 401,
                        body: {
                            error: "Unauthorized",
                        },
                    };
                }

                const pledge = await useCase.execute({
                    marketId: params.marketId,
                    outcomeId: input.outcomeId,
                    userId: user.userId,
                    amount: input.amount,
                });

                return { pledge };
            }
        )
    );

    return createPredictionPledgeRoute;
}
