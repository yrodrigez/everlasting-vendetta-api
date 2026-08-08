import { createRoute, RouteContext } from "@http/hono-adapter";
import {
    vxAdminMiddleware,
    guildMemberMiddleware,
} from "@http/middleware/guild-member.middleware";
import { CreatePredictionMarketUseCase } from "@use-cases/evx/predictions/create-prediction-market.usecase";
import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod/v3";

const createPredictionMarketSchema = z.object({
    resetId: z.string().uuid().optional(),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).optional(),
    closesAt: z
        .string()
        .datetime()
        .transform((value) => new Date(value)),
    type: z.enum(["YES_NO", "MULTIPLE_CHOICE", "NUMERIC_RANGE"]),
    outcomes: z.array(z.string().trim().min(1)).optional(),
});

type CreatePredictionMarketInput = z.infer<typeof createPredictionMarketSchema>;

export function buildCreatePredictionMarketRoute(
    useCase: CreatePredictionMarketUseCase,
    authMiddleware: MiddlewareHandler
) {
    const createPredictionMarketRoute = new Hono();

    createPredictionMarketRoute.post(
        "/markets",
        authMiddleware,
        guildMemberMiddleware,
        vxAdminMiddleware,
        createRoute<CreatePredictionMarketInput>(
            {
                functionName: "create-prediction-market",
                inputSchema: createPredictionMarketSchema,
            },
            async ({
                input,
                user,
            }: RouteContext<CreatePredictionMarketInput>) => {
                if (!user) {
                    return {
                        status: 401,
                        body: {
                            error: "Unauthorized",
                        },
                    };
                }

                const market = await useCase.execute(input, user.userId);

                return { market };
            }
        )
    );

    return createPredictionMarketRoute;
}
