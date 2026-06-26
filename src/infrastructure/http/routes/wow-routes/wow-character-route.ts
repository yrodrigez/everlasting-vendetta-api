import { DatabaseClientFactory } from "@database/database-client-factory";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { CharacterEquipmentService } from "@external/character-equipment-service";
import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import {
    wowCharacterParamsSchema,
    wowCharacterQuerySchema,
    type WowCharacterParams,
    type WowCharacterQuery,
} from "@http/validators/schemas/wow-routes-schemas";
import { Hono } from "hono";
import { WowCharacterUseCaseFactory } from "src/infrastructure/factories/wow/wow-character-usecase-factory";
import { BlizzardTokenRepository } from "src/infrastructure/repositories/blizzard-token-repository";

const wowCharacterRouter = new Hono();

wowCharacterRouter.get(
    "/:realm/:name/equipment",
    authMiddleware,
    createRoute<unknown, unknown, unknown, WowCharacterParams>(
        {
            functionName: "wow-character-equipment",
            paramsSchema: wowCharacterParamsSchema,
        },
        async ({ params }) => {
            const databaseClient = DatabaseClientFactory.getInstance();
            const tokenRepository = new BlizzardTokenRepository(
                databaseClient,
                new BlizzardOauthService()
            );
            const token = await tokenRepository.getCurrentToken();
            const equipmentService = new CharacterEquipmentService();

            return equipmentService.fetchEquipment(
                params.name.toLowerCase(),
                params.realm.toLowerCase(),
                token.access_token
            );
        }
    )
);

wowCharacterRouter.get(
    "/:realm/:name",
    authMiddleware,
    createRoute<unknown, unknown, WowCharacterQuery, WowCharacterParams>(
        {
            functionName: "wow-character",
            querySchema: wowCharacterQuerySchema,
            paramsSchema: wowCharacterParamsSchema,
        },
        async (ctx) => {
            const controller = WowCharacterUseCaseFactory.make();
            return controller.handle(ctx);
        }
    )
);

export default wowCharacterRouter;
