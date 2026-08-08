import { createRoute, RouteContext } from "@http/hono-adapter";
import { guildMemberMiddleware } from "@http/middleware/guild-member.middleware";
import { FindMyPredictionPledgesUseCase } from "@use-cases/evx/predictions/find-my-prediction-pledges.usecase";
import { Hono, type MiddlewareHandler } from "hono";

export function buildFindMyPredictionPledgesRoute(
    useCase: FindMyPredictionPledgesUseCase,
    authMiddleware: MiddlewareHandler
) {
    const findMyPredictionPledgesRoute = new Hono();

    findMyPredictionPledgesRoute.get(
        "/pledges/me",
        authMiddleware,
        guildMemberMiddleware,
        createRoute(
            { functionName: "find-my-prediction-pledges" },
            async ({ user }: RouteContext<unknown>) => {
                if (!user) {
                    return {
                        status: 401,
                        body: {
                            error: "Unauthorized",
                        },
                    };
                }

                const pledges = await useCase.execute(user.userId);

                return { pledges };
            }
        )
    );

    return findMyPredictionPledgesRoute;
}
