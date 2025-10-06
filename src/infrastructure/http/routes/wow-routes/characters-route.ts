import { createRoute } from "@http/hono-adapter";
import {
    UserCharactersQuery,
    UserCharactersHeaders,
    userCharactersQuerySchema,
    userCharactersHeadersSchema
} from "@http/validators/schemas/wow-routes-schemas";
import { Hono } from "hono";
import { DatabaseClientFactory } from "@database/database-client-factory";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { BlizzardTokenRepository } from "src/infrastructure/repositories/blizzard-token-repository";
import { WowCharacterService } from "@external/wow-character-service";
import { UserRepository } from "src/infrastructure/repositories/user-repository";
import { JWTTokenService } from "src/infrastructure/security/jwt-token-service";
import { getEnvironment } from "src/infrastructure/environment";
import { GetUserCharacters } from "@use-cases/get-user-characters";
import { AuthError } from "@errors/auth-error";
import { UserRepositoryError } from "@errors/user-repository-error";
import { TokenNotFoundError } from "@errors/blizzard-token-errors";
import { createLogger } from "src/infrastructure/logging/index.ts";

const characterRoutes = new Hono();
const logger = createLogger("CharacterRoutes");

characterRoutes.get(createRoute<unknown, unknown, UserCharactersQuery, unknown, UserCharactersHeaders>(
    {
        functionName: "user-characters",
        querySchema: userCharactersQuerySchema,
        headersSchema: userCharactersHeadersSchema,
    },
    async ({ query, headers }) => {
        try {
            // Extract token from Authorization header (Bearer token)
            const authHeader = headers.authorization;
            const accessToken = authHeader.startsWith('Bearer ')
                ? authHeader.substring(7)
                : authHeader;

            const realmSlug = query.realmSlug;
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
            const wowCharacterService = new WowCharacterService(blizzardToken.access_token);

            // Initialize repositories
            const userRepository = new UserRepository(databaseClient);

            // Initialize token service
            const { jwtKid, jwtSecret } = getEnvironment();
            const tokenService = new JWTTokenService(jwtSecret, jwtSecret, jwtKid);

            // Create and execute use case
            const getUserCharacters = new GetUserCharacters(
                tokenService,
                userRepository,
                wowCharacterService
            );

            const characters = await getUserCharacters.execute({
                accessToken: accessToken,
                realmSlug
            });

            return characters;
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