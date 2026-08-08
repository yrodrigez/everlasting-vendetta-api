import { createRoute } from "@http/hono-adapter";
import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod/v3";
import { Member } from "@entities/member";
import { createLogger } from "@infrastructure/logging";
import type { IMemberRepository } from "@repositories/i-member-repository";

const unlinkSchema = z.object({
    characterId: z.number(),
});

type UnlinkInput = z.infer<typeof unlinkSchema>;

const logger = createLogger("character-unlink-route");

export function buildCharacterUnlinkRoute(
    memberRepository: IMemberRepository,
    authMiddleware: MiddlewareHandler
) {
    const characterUnlinkRoute = new Hono();

    characterUnlinkRoute.post(
        "/",
        authMiddleware,
        createRoute<UnlinkInput>(
            {
                functionName: "unlink-character",
                inputSchema: unlinkSchema,
            },
            async ({ input: { characterId }, c }) => {
                const user = c.get("user");
                if (!user) {
                    throw new Error("User not authenticated");
                }

                const currentUserId = user.userId;
                // Verify character exists and belongs to user
                const character = await memberRepository.findById(characterId);
                if (!character) {
                    throw new Error("Character not found");
                }

                if (character.userId !== currentUserId) {
                    throw new Error("You can only unlink your own characters");
                }

                // Create updated member with undefined user_id
                const updated = new Member(
                    character.id,
                    undefined, // Remove user_id
                    character.wowAccountId,
                    character.character,
                    character.registrationSource,
                    character.created_at,
                    new Date()
                );

                await memberRepository.update(updated);
                logger.info(
                    `Character ${characterId} unlinked from user ${currentUserId}`
                );

                // Return updated linked characters
                const remainingCharacters =
                    await memberRepository.findAllByUserId(currentUserId);

                return {
                    success: true,
                    message: "Character unlinked successfully",
                    linkedCharacters: remainingCharacters.map((m) => ({
                        id: m.character.id,
                        name: m.character.name,
                        realm: m.character.realm.name,
                        realmSlug: m.character.realm.slug,
                        class:
                            m.character.playable_class.name ||
                            m.character.character_class.name,
                        level: m.character.level,
                        avatar: m.character.avatar,
                        linkedAt: m.created_at?.toISOString(),
                        registrationSource: m.registrationSource,
                    })),
                };
            }
        )
    );

    return characterUnlinkRoute;
}
