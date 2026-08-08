import { createRoute } from "@http/hono-adapter";
import { RevokeAllTokensUseCase } from "@use-cases/revoke-all-tokens-usecase";
import { Hono, type MiddlewareHandler } from "hono";

export function buildRevokeAllRoute(
    useCase: RevokeAllTokensUseCase,
    authMiddleware: MiddlewareHandler
) {
    const revokeAllRoute = new Hono();

    revokeAllRoute.post(
        "/",
        authMiddleware,
        createRoute(
            {
                functionName: "auth-revoke-all",
            },
            async ({ c }) => {
                const user = c.get("user");

                if (!user) {
                    throw new Error("User not authenticated");
                }

                return useCase.execute({
                    userId: user.userId,
                    reason: "logout_all",
                });
            }
        )
    );

    return revokeAllRoute;
}
