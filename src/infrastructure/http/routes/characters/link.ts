import { LinkCharacterController } from "@http/controllers/wow/link-character-controller";
import { createRoute, RouteContext } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { createLogger } from "@infrastructure/logging";
import { Hono } from "hono";
import { z } from "zod/v3";

const linkSchema = z.object({
    characterName: z.string().min(1),
    realmSlug: z.string().min(1),
});

type LinkInput = z.infer<typeof linkSchema>;

const characterLinkRoute = new Hono();

characterLinkRoute.post(
    "/",
    authMiddleware,
    createRoute<LinkInput>(
        {
            functionName: "link-character",
            inputSchema: linkSchema,
        },
        async (routeContext: RouteContext<LinkInput>) => {
            const controller = new LinkCharacterController();
            const characters = await controller.handle(routeContext);
            return { characters };
        }
    )
);

export { characterLinkRoute };
