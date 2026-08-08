import { LinkCharacterController } from "@http/controllers/wow/link-character-controller";
import { createRoute } from "@http/hono-adapter";
import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod/v3";

const linkSchema = z.object({
    characterName: z.string().min(1),
    realmSlug: z.string().min(1),
});

type LinkInput = z.infer<typeof linkSchema>;

export function buildCharacterLinkRoute(
    controller: LinkCharacterController,
    authMiddleware: MiddlewareHandler
) {
    const characterLinkRoute = new Hono();

    characterLinkRoute.post(
        "/",
        authMiddleware,
        createRoute<LinkInput>(
            {
                functionName: "link-character",
                inputSchema: linkSchema,
            },
            async ({ c, input }) => {
                const user = c.get("user");
                if (!user) {
                    throw new Error("User not authenticated");
                }

                const characters = await controller.handle({
                    userId: user.userId,
                    characterName: input.characterName,
                    realmSlug: input.realmSlug,
                });
                return { characters };
            }
        )
    );

    return characterLinkRoute;
}
