import { DatabaseClientFactory } from "@database/database-client-factory";
import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { revokeSchema, RevokeInput } from "@http/validators/schemas/auth-schema";
import { RevokeTokenUseCase } from "@use-cases/revoke-token-usecase";
import { Hono } from "hono";
import { AuthRepository } from "src/infrastructure/repositories/auth-repository";

const revokeRoute = new Hono();

revokeRoute.post(
    '/',
    authMiddleware,
    createRoute<RevokeInput>(
        {
            functionName: "auth-revoke",
            inputSchema: revokeSchema,
        },
        async ({ c, input }) => {
            const user = c.get('user');
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            const database = DatabaseClientFactory.getInstance();
            const authRepository = new AuthRepository(database);
            const useCase = new RevokeTokenUseCase(authRepository);

            const result = await useCase.execute({
                userId: user.sub,
                tokenJti: input.token_jti,
                reason: 'manual'
            });

            return result;
        }
    )
);

export { revokeRoute };
