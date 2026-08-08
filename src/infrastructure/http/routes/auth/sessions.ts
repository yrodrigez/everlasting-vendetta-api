import { createRoute } from "@http/hono-adapter";
import { GetUserSessionsUseCase } from "@use-cases/get-user-sessions-usecase";
import { Hono, type MiddlewareHandler } from "hono";

export function buildSessionsRoute(
    useCase: GetUserSessionsUseCase,
    authMiddleware: MiddlewareHandler
) {
    const sessionsRoute = new Hono();

    sessionsRoute.get(
        "/",
        authMiddleware,
        createRoute(
            {
                functionName: "auth-sessions",
            },
            async ({ c }) => {
                const user = c.get("user");

                if (!user) {
                    throw new Error("User not authenticated");
                }

                return useCase.execute({
                    userId: user.userId,
                    currentJti: user.jti,
                });
            }
        )
    );

    return sessionsRoute;
}
