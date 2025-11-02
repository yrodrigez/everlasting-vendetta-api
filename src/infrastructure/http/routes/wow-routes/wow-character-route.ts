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

const wowCharacterRouter = new Hono();

wowCharacterRouter.get(
    "/:realm/:name",
    authMiddleware,
    createRoute<
        unknown,
        unknown,
        WowCharacterQuery,
        WowCharacterParams
    >(
        {
            functionName: "wow-character",
            querySchema: wowCharacterQuerySchema,
            paramsSchema: wowCharacterParamsSchema,
        },
        async (ctx) => {
            const controller = WowCharacterUseCaseFactory.make();
            return controller.handle(ctx);
        },
    ),
);

export default wowCharacterRouter;
