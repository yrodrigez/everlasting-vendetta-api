import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { guildMemberMiddleware } from "@http/middleware/guild-member.middleware";
import { evxContainer } from "@infrastructure/di/evx/evx.container";
import { FindEVXLeaderboardUseCase } from "@use-cases/evx/wallets/find-evx-leaderboard.usecase";
import { Hono } from "hono";

const findEVXLeaderboardRoute = new Hono();

findEVXLeaderboardRoute.get(
    "/leaderboard",
    authMiddleware,
    guildMemberMiddleware,
    createRoute({ functionName: "find-evx-leaderboard" }, async () => {
        const usecase = evxContainer.resolve<FindEVXLeaderboardUseCase>(
            "FindEVXLeaderboardUseCase"
        );
        const leaderboard = await usecase.execute();

        return { leaderboard };
    })
);

export { findEVXLeaderboardRoute };
