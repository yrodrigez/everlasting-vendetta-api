import { AuthError } from "@errors/auth-error";
import { LinkOauthAccountController } from "@http/controllers/auth/link-oauth-account-controller";
import { createRoute } from "@http/hono-adapter";
import {
    LinkOAuthAccountSchema,
    linkOAuthAccountSchema,
} from "@http/validators/schemas/auth-schema";
import { Hono, type MiddlewareHandler } from "hono";

export function buildLinkOAuthAccountRoute(
    controller: LinkOauthAccountController,
    authMiddleware: MiddlewareHandler
) {
    const route = new Hono();

    route.post(
        "/",
        authMiddleware,
        createRoute<LinkOAuthAccountSchema>(
            {
                functionName: "auth-link-oauth-account",
                inputSchema: linkOAuthAccountSchema,
            },
            async ({ c, input }) => {
                const user = c.get("user");
                if (!user) {
                    throw new AuthError(
                        "User not authenticated",
                        "USER_NOT_AUTHENTICATED",
                        401
                    );
                }

                return controller.handle({
                    userId: user.userId,
                    provider: input.provider,
                    accessToken: input.accessToken,
                    refreshToken: input.refreshToken,
                    tokenExpiresAt: input.tokenExpiresAt,
                });
            }
        )
    );

    return route;
}
