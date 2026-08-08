import { Hono } from "hono";
import { createAuthMiddleware } from "@http/middleware/auth.middleware";
import { AUTH_TOKENS } from "@infrastructure/di/auth/auth.container";
import type { Container } from "@infrastructure/di/container";
import { EVX_TOKENS } from "@infrastructure/di/evx/evx.container";
import { buildCreatePredictionMarketRoute } from "./create-prediction-market.route";
import { buildCreatePredictionPledgeRoute } from "./create-prediction-pledge.route";
import { buildFindAllWalletsRoute } from "./find-all-wallets.route";
import { buildFindEVXLeaderboardRoute } from "./find-evx-leaderboard.route";
import { buildFindMyPredictionPledgesRoute } from "./find-my-prediction-pledges.route";
import { buildFindPredictionMarketsRoute } from "./find-prediction-markets.route";
import { buildMyWalletRoute } from "./my-wallet.route";
import { buildPredictionMarketLifecycleRoute } from "./prediction-market-lifecycle.route";

export function buildEvxRoutes(container: Container): Hono {
    const routes = new Hono();
    const authMiddleware = createAuthMiddleware(
        container.resolve(AUTH_TOKENS.JwtTokenGenerator)
    );

    routes.route(
        "/",
        buildFindEVXLeaderboardRoute(
            container.resolve(EVX_TOKENS.FindEVXLeaderboardUseCase),
            authMiddleware
        )
    );
    routes.route(
        "/",
        buildFindPredictionMarketsRoute(
            container.resolve(EVX_TOKENS.FindPredictionMarketsUseCase),
            container.resolve(EVX_TOKENS.FindPredictionMarketByIdUseCase),
            authMiddleware
        )
    );
    routes.route(
        "/",
        buildFindMyPredictionPledgesRoute(
            container.resolve(EVX_TOKENS.FindMyPredictionPledgesUseCase),
            authMiddleware
        )
    );
    routes.route(
        "/",
        buildCreatePredictionMarketRoute(
            container.resolve(EVX_TOKENS.CreatePredictionMarketUseCase),
            authMiddleware
        )
    );
    routes.route(
        "/",
        buildCreatePredictionPledgeRoute(
            container.resolve(EVX_TOKENS.CreatePredictionPledgeUseCase),
            authMiddleware
        )
    );
    routes.route(
        "/",
        buildPredictionMarketLifecycleRoute(
            container.resolve(EVX_TOKENS.OpenPredictionMarketUseCase),
            container.resolve(EVX_TOKENS.FinalizePredictionMarketUseCase),
            container.resolve(EVX_TOKENS.CancelPredictionMarketUseCase),
            authMiddleware
        )
    );
    routes.route(
        "/",
        buildFindAllWalletsRoute(
            container.resolve(EVX_TOKENS.FindAllWalletsUseCase),
            authMiddleware
        )
    );
    routes.route(
        "/",
        buildMyWalletRoute(
            container.resolve(EVX_TOKENS.CreateNewWalletUseCase),
            authMiddleware
        )
    );

    return routes;
}
