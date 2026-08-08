import { GetMyProfileController } from "@http/controllers/auth/get-my-profile-controller";
import { LinkOauthAccountController } from "@http/controllers/auth/link-oauth-account-controller";
import { LoginController } from "@http/controllers/auth/login.controller";
import { RefreshTokenController } from "@http/controllers/auth/refresh.controller";
import { createAuthMiddleware } from "@http/middleware/auth.middleware";
import { AUTH_TOKENS } from "@infrastructure/di/auth/auth.container";
import type { Container } from "@infrastructure/di/container";
import { Hono } from "hono";
import { buildGetMyProfileRoute } from "./get-my-profile";
import { buildLinkOAuthAccountRoute } from "./link-oauth-account";
import { buildLoginRoute } from "./login";
import { buildRefreshSessionRoute } from "./refresh";
import { buildRevokeRoute } from "./revoke";
import { buildRevokeAllRoute } from "./revoke-all";
import { buildSessionsRoute } from "./sessions";

export function buildAuthRoutes(container: Container): Hono {
    const router = new Hono();
    const authMiddleware = createAuthMiddleware(
        container.resolve(AUTH_TOKENS.JwtTokenGenerator)
    );

    const loginController = new LoginController(
        container.resolve(AUTH_TOKENS.LoginUseCase)
    );
    router.route("/login", buildLoginRoute(loginController));

    const refreshController = new RefreshTokenController(
        container.resolve(AUTH_TOKENS.GetSessionUseCase)
    );
    router.route("/refresh", buildRefreshSessionRoute(refreshController));

    router.route(
        "/sessions",
        buildSessionsRoute(
            container.resolve(AUTH_TOKENS.GetUserSessionsUseCase),
            authMiddleware
        )
    );
    router.route(
        "/revoke",
        buildRevokeRoute(
            container.resolve(AUTH_TOKENS.RevokeTokenUseCase),
            authMiddleware
        )
    );
    router.route(
        "/revoke_all",
        buildRevokeAllRoute(
            container.resolve(AUTH_TOKENS.RevokeAllTokensUseCase),
            authMiddleware
        )
    );

    const linkOAuthAccountController = new LinkOauthAccountController(
        container.resolve(AUTH_TOKENS.LinkOAuthAccountUseCase)
    );
    router.route(
        "/link-oauth-account",
        buildLinkOAuthAccountRoute(linkOAuthAccountController, authMiddleware)
    );

    const getMyProfileController = new GetMyProfileController(
        container.resolve(AUTH_TOKENS.GetMyProfileUseCase)
    );
    router.route(
        "/my-profile",
        buildGetMyProfileRoute(getMyProfileController, authMiddleware)
    );

    return router;
}
