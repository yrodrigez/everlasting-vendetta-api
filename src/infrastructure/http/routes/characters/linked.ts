import { createRoute } from "@http/hono-adapter";
import { Hono, type MiddlewareHandler } from "hono";
import { createLogger } from "@infrastructure/logging";
import type { IMemberRepository } from "@repositories/i-member-repository";

const logger = createLogger("character-linked-route");

export function buildCharacterLinkedRoute(
    memberRepository: IMemberRepository,
    authMiddleware: MiddlewareHandler
) {
    const characterLinkedRoute = new Hono();

    characterLinkedRoute.get(
        "/",
        authMiddleware,
        createRoute(
            {
                functionName: "get-linked-characters",
            },
            async ({ c }) => {
                const user = c.get("user");
                if (!user) {
                    throw new Error("User not authenticated");
                }

                const linkedCharacters = await memberRepository.findAllByUserId(
                    user.userId
                );

                logger.info(
                    `Retrieved ${linkedCharacters.length} linked characters for user ${user.userId}`
                );

                return { linkedCharacters };
            }
        )
    );

    return characterLinkedRoute;
}
