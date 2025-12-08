import { createRoute, RouteContext } from "@http/hono-adapter";
import { Hono } from "hono";
import { z } from "zod/v3";
import { DatabaseClientFactory } from "@database/database-client-factory";
import { MemberRepository } from "@infrastructure/repositories/member-repository";
import { CharacterValidationService } from "@domain/services/character-validation-service";
import { WowCharacterService } from "@external/wow-character-service";
import { Member, MemberCharacter } from "@entities/member";
import { createLogger } from "@infrastructure/logging";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { LinkCharacterController } from "@http/controllers/wow/link-character-controller";

const linkSchema = z.object({
    characterName: z.string().min(1),
    realmSlug: z.string().min(1),
});

type LinkInput = z.infer<typeof linkSchema>;

const characterLinkRoute = new Hono();
const logger = createLogger('character-link-route');

characterLinkRoute.post(
    '/',
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
