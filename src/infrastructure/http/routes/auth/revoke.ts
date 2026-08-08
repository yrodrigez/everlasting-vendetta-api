import { createRoute } from "@http/hono-adapter";
import {
    revokeSchema,
    RevokeInput,
} from "@http/validators/schemas/auth-schema";
import { RevokeTokenUseCase } from "@use-cases/revoke-token-usecase";
import { Hono, type MiddlewareHandler } from "hono";

export function buildRevokeRoute(
    useCase: RevokeTokenUseCase,
    authMiddleware: MiddlewareHandler
) {
    const revokeRoute = new Hono();

    revokeRoute.post(
        "/",
        authMiddleware,
        createRoute<RevokeInput>(
            {
                functionName: "auth-revoke",
                inputSchema: revokeSchema,
            },
            async ({ c, input }) => {
                const user = c.get("user");

                if (!user) {
                    throw new Error("User not authenticated");
                }

                return useCase.execute({
                    userId: user.userId,
                    tokenJti: input.token_jti,
                    reason: "manual",
                });
            }
        )
    );

    return revokeRoute;
}
