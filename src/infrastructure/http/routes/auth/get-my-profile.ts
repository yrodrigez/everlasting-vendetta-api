import { AuthError } from "@errors/auth-error";
import { GetMyProfileController } from "@http/controllers/auth/get-my-profile-controller";
import { createRoute } from "@http/hono-adapter";
import { Hono, type MiddlewareHandler } from "hono";

export function buildGetMyProfileRoute(
    controller: GetMyProfileController,
    authMiddleware: MiddlewareHandler
) {
    const route = new Hono();

    route.get(
        "/",
        authMiddleware,
        createRoute(
            {
                functionName: "get-my-profile",
            },
            async (ctx) => {
                const user = ctx.c.get("user");
                if (!user) {
                    throw new AuthError(
                        "User not authenticated",
                        "USER_NOT_AUTHENTICATED",
                        401
                    );
                }
                const currentUserId = user.userId;
                return controller.handle({ userId: currentUserId });
            }
        )
    );
    return route;
}
