import { Hono } from "hono";
import { LinkCharacterController } from "@http/controllers/wow/link-character-controller";
import { createAuthMiddleware } from "@http/middleware/auth.middleware";
import { AUTH_TOKENS } from "@infrastructure/di/auth/auth.container";
import { CHARACTER_TOKENS } from "@infrastructure/di/characters/characters.container";
import type { Container } from "@infrastructure/di/container";
import { DATABASE_TOKENS } from "@infrastructure/di/persistence/database.container";
import { buildCharacterLinkRoute } from "./link";
import { buildCharacterLinkedRoute } from "./linked";
import { buildSetSelectedCharacterRoute } from "./set-selected-character";
import { buildCharacterUnlinkRoute } from "./unlink";
import { buildGetSelectedCharacterRoute } from "./get-selected-character";

export function buildCharacterRoutes(container: Container): Hono {
    const characterRoutes = new Hono();
    const authMiddleware = createAuthMiddleware(
        container.resolve(AUTH_TOKENS.JwtTokenGenerator)
    );
    const memberRepository = container.resolve(AUTH_TOKENS.MemberRepository);

    const linkController = new LinkCharacterController(
        container.resolve(CHARACTER_TOKENS.LinkCharacterToUserUseCase)
    );
    characterRoutes.route(
        "/link",
        buildCharacterLinkRoute(linkController, authMiddleware)
    );
    characterRoutes.route(
        "/linked",
        buildCharacterLinkedRoute(memberRepository, authMiddleware)
    );
    characterRoutes.route(
        "/unlink",
        buildCharacterUnlinkRoute(memberRepository, authMiddleware)
    );
    characterRoutes.route(
        "/select",
        buildSetSelectedCharacterRoute(
            container.resolve(CHARACTER_TOKENS.SetSelectedCharacterUseCase),
            authMiddleware
        )
    );
    characterRoutes.route(
        "/selected",
        buildGetSelectedCharacterRoute(
            container.resolve(DATABASE_TOKENS.RedisStore),
            authMiddleware
        )
    );

    return characterRoutes;
}
