import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import {
    characterAvatarParamsSchema,
    characterAvatarQuerySchema,
    type CharacterAvatarParams,
    type CharacterAvatarQuery,
} from "@http/validators/schemas/wow-routes-schemas";
import { Hono } from "hono";
import { CharacterAvatarUseCaseFactory } from "src/infrastructure/factories/wow/character-avatar-usecase-factory";

const characterAvatarRouter = new Hono();

characterAvatarRouter.get(
    "/:realm/:name",
    authMiddleware,
    createRoute<
        unknown,
        unknown,
        CharacterAvatarQuery,
        CharacterAvatarParams
    >(
        {
            functionName: "character-avatar",
            querySchema: characterAvatarQuerySchema,
            paramsSchema: characterAvatarParamsSchema,
        },
        async (ctx) => {
            const characterAvatarController = CharacterAvatarUseCaseFactory.make();
            return await characterAvatarController.handle(ctx);
        },
    ),
);

export default characterAvatarRouter;
