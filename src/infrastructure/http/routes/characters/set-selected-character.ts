import { createRoute } from "@http/hono-adapter";
import { Hono } from "hono";
import { DatabaseClientFactory } from "@database/database-client-factory";
import { MemberRepository } from "@infrastructure/repositories/member-repository";
import { createLogger } from "@infrastructure/logging";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { SetSelectedCharacterUseCase } from "@use-cases/set-selected-character-usecase";
import { z } from "zod/v3";

const setSelectedCharacterRoute = new Hono();
const logger = createLogger('set-selected-character-route');

const setSelectedCharacterSchema = z.object({
    characterId: z.number(),
});
type SetSelectedCharacterInput = z.infer<typeof setSelectedCharacterSchema>;

setSelectedCharacterRoute.post(
    '/',
    authMiddleware,
    createRoute<SetSelectedCharacterInput>(
        {
            functionName: "set-selected-character",
            inputSchema: setSelectedCharacterSchema,
        },
        async ({ c, input }) => {

            const user = c.get('user');
            if (!user) {
                throw new Error('User not authenticated');
            }

            const currentUserId = user.userId;
            const databaseClient = DatabaseClientFactory.getInstance();
            const memberRepository = new MemberRepository(databaseClient);
            const { characterId } = input;
            const useCase = new SetSelectedCharacterUseCase(databaseClient, memberRepository, logger);
            await useCase.execute(currentUserId, characterId);

            return { ok: true };
        }
    )
);

export { setSelectedCharacterRoute };
