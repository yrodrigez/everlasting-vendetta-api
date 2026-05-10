import { createRoute, RouteContext } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { guildMemberMiddleware } from "@http/middleware/guild-member.middleware";
import { evxContainer } from "@infrastructure/di/evx/evx.container";
import { FindMyPredictionPledgesUseCase } from "@use-cases/evx/predictions/find-my-prediction-pledges.usecase";
import { Hono } from "hono";

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

            const usecase =
                evxContainer.resolve<FindMyPredictionPledgesUseCase>(
                    "FindMyPredictionPledgesUseCase"
                );
            const pledges = await usecase.execute(user.userId);

            return { pledges };
        }
    )
);

export { findMyPredictionPledgesRoute };
