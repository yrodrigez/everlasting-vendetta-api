import { DatabaseClientFactory } from "@database/database-client-factory";
import { AuthError } from "@errors/auth-error";
import { TokenNotFoundError } from "@errors/blizzard-token-errors";
import { UserRepositoryError } from "@errors/user-repository-error";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { WowCharacterService } from "@external/wow-character-service";
import { createRoute } from "@http/hono-adapter";
import { authenticatedUserMiddleware, authMiddleware } from "@http/middleware/auth.middleware";
import {
    UserCharactersQuery,
    userCharactersQuerySchema
} from "@http/validators/schemas/wow-routes-schemas";
import { GetUserCharacters } from "@use-cases/get-user-characters";
import { Hono } from "hono";
import { createLogger } from "src/infrastructure/logging/index.ts";
import { BlizzardTokenRepository } from "src/infrastructure/repositories/blizzard-token-repository";
import { UserRepository } from "src/infrastructure/repositories/user-repository";

const characterRoutes = new Hono();
const logger = createLogger("CharacterRoutes");

characterRoutes.get(
    '/',
    authMiddleware,
    authenticatedUserMiddleware,
    createRoute<unknown, unknown, UserCharactersQuery>(
        {
            functionName: "user-characters",
            querySchema: userCharactersQuerySchema,
        },
        async ({ query, user }) => {
            try {

                const realmSlug = query.realmSlug || 'living-flame';
                
                // Initialize database client
                const databaseClient = DatabaseClientFactory.getInstance();

                // Initialize Blizzard services
                const blizzardOauthService = new BlizzardOauthService();
                const blizzardTokenRepository = new BlizzardTokenRepository(
                    databaseClient,
                    blizzardOauthService
                );

                // Get generic Blizzard token for API calls
                let blizzardToken;
                try {
                    blizzardToken = await blizzardTokenRepository.getCurrentToken();
                } catch (error) {
                    logger.error('Failed to get Blizzard token', error);
                    throw new TokenNotFoundError(
                        'Unable to authenticate with Blizzard API. Please try again later.'
                    );
                }

                // Initialize services with Blizzard token
                const wowCharacterService = new WowCharacterService();

                // Initialize repositories
                const userRepository = new UserRepository(databaseClient);


                // Create and execute use case
                const getUserCharacters = new GetUserCharacters(
                    userRepository,
                    wowCharacterService
                );
                const userId = user?.userId;
                if (!userId) {
                    throw new AuthError('Unauthorized: User ID not found');
                }
                const characters = await getUserCharacters.execute({
                    userId: userId,
                    realmSlug,
                    accessToken: blizzardToken.access_token,
                });

                return { characters };
            } catch (error) {
                logger.error('Error in user-characters route', error);

                // Handle specific error types
                if (error instanceof AuthError) {
                    throw error; // Re-throw with original status code
                }

                if (error instanceof UserRepositoryError) {
                    throw new UserRepositoryError(
                        'Failed to fetch user characters from database'
                    );
                }

                if (error instanceof TokenNotFoundError) {
                    throw error;
                }

                // Generic error fallback
                throw new Error(
                    `Failed to fetch user characters: ${(error as Error).message}`
                );
            }
        }));

export { characterRoutes };
