import { DatabaseClientFactory } from "@database/database-client-factory";
import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { RevokeAllTokensUseCase } from "@use-cases/revoke-all-tokens-usecase";
import { Hono } from "hono";
import { AuthRepository } from "src/infrastructure/repositories/auth-repository";

const revokeAllRoute = new Hono();

revokeAllRoute.post(
    '/',
    authMiddleware,
    createRoute(
        {
            functionName: "auth-revoke-all",
        },
        async ({ c }) => {
            const user = c.get('user');
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            const database = DatabaseClientFactory.getInstance();
            const authRepository = new AuthRepository(database);
            const useCase = new RevokeAllTokensUseCase(authRepository);

            const result = await useCase.execute({
                userId: user.sub,
                reason: 'logout_all'
            });

            return result;
        }
    )
);

export { revokeAllRoute };
