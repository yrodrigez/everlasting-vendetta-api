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
import { CharacterEquipmentService } from "@external/character-equipment-service";
import { ItemService } from "@external/item-service";
import { CalculateGearScoreUseCase } from "@use-cases/calculate-gearscore-usecase";
import { authMiddleware } from "@http/middleware/auth.middleware";

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
                blizzardOauthService,
            );
            const cacheRepository = new GearScoreCacheRepository(
                databaseClient,
            );
            const equipmentService = new CharacterEquipmentService();
            const itemService = new ItemService(databaseClient);

            const calculateGearScoreUseCase = new CalculateGearScoreUseCase(
                tokenRepository,
                cacheRepository,
                equipmentService,
                itemService,
            );

            const gearScores = await calculateGearScoreUseCase.execute({
                characters: input.characters,
                forceRefresh: input.forceRefresh,
            });

            return {
                success: true,
                data: gearScores,
            };
        },
    ),
);

export { gearscoreRoutes };
