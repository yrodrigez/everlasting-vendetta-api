import { Hono } from "hono";
import { createRoute } from "@http/hono-adapter";
import {
    calculateGearScoreSchema,
    CalculateGearScoreInput,
    anonTokenHeadersSchema,
    CalculateGearScoreHeaders,
} from "@http/validators/schemas/gearscore-schema";
import { DatabaseClientFactory } from "@database/database-client-factory";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { BlizzardTokenRepository } from "src/infrastructure/repositories/blizzard-token-repository";
import { GearScoreCacheRepository } from "src/infrastructure/repositories/gearscore-cache-repository";
import { HighestGSRepository } from "src/infrastructure/repositories/highest-gs-repository";
import { CharacterEquipmentService } from "@external/character-equipment-service";
import { ItemService } from "@external/item-service";
import { CalculateGearScoreUseCase } from "@use-cases/calculate-gearscore-usecase";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { GearScoreResolver } from "src/application/services/gear-score/gear-score-resolver";

const gearscoreRoutes = new Hono();

gearscoreRoutes.post(
    authMiddleware,
    createRoute<
        CalculateGearScoreInput,
        unknown,
        unknown,
        unknown,
        CalculateGearScoreHeaders
    >(
        {
            functionName: "calculate-gearscore",
            inputSchema: calculateGearScoreSchema,
            headersSchema: anonTokenHeadersSchema,
        },
        async ({ input }) => {
            const databaseClient = DatabaseClientFactory.getInstance();
            const blizzardOauthService = new BlizzardOauthService();

            const tokenRepository = new BlizzardTokenRepository(
                databaseClient,
                blizzardOauthService
            );
            const cacheRepository = new GearScoreCacheRepository(
                databaseClient
            );
            const highestGSRepository = new HighestGSRepository(databaseClient);
            const equipmentService = new CharacterEquipmentService();
            const itemService = new ItemService(databaseClient);
            const gearScoreResolver = new GearScoreResolver(
                cacheRepository,
                itemService,
                highestGSRepository
            );

            const calculateGearScoreUseCase = new CalculateGearScoreUseCase(
                tokenRepository,
                equipmentService,
                gearScoreResolver
            );

            const gearScores = await calculateGearScoreUseCase.execute({
                characters: input.characters,
                forceRefresh: input.forceRefresh,
            });

            return {
                success: true,
                data: gearScores,
            };
        }
    )
);

export { gearscoreRoutes };
