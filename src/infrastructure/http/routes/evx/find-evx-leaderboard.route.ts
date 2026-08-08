import { createRoute } from "@http/hono-adapter";
import { guildMemberMiddleware } from "@http/middleware/guild-member.middleware";
import { FindEVXLeaderboardUseCase } from "@use-cases/evx/wallets/find-evx-leaderboard.usecase";
import { Hono, type MiddlewareHandler } from "hono";

export function buildFindEVXLeaderboardRoute(
    useCase: FindEVXLeaderboardUseCase,
    authMiddleware: MiddlewareHandler
) {
    const findEVXLeaderboardRoute = new Hono();

    findEVXLeaderboardRoute.get(
        "/leaderboard",
        authMiddleware,
        guildMemberMiddleware,
        createRoute({ functionName: "find-evx-leaderboard" }, async () => {
            const leaderboard = await useCase.execute();

            return { leaderboard };
        })
    );

    return findEVXLeaderboardRoute;
}
