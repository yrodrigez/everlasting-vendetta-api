import { DatabaseClientFactory } from "@database/database-client-factory";
import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { GetUserSessionsUseCase } from "@use-cases/get-user-sessions-usecase";
import { Hono } from "hono";
import { AuthRepository } from "src/infrastructure/repositories/auth-repository";

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

            const database = DatabaseClientFactory.getInstance();
            const authRepository = new AuthRepository(database);
            const useCase = new GetUserSessionsUseCase(authRepository);

            const result = await useCase.execute({
                userId: user.sub,
                currentJti: user.jti,
            });

            return result;
        }
    )
);

export { sessionsRoute };
