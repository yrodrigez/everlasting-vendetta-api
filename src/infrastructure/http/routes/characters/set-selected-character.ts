import { createRoute } from "@http/hono-adapter";
import { Hono } from "hono";
import { DatabaseClient } from "@database/database-client-factory";
import { createLogger } from "@infrastructure/logging";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { SetSelectedCharacterUseCase } from "@use-cases/set-selected-character-usecase";
import { z } from "zod/v3";
import { authContainer } from "@infrastructure/di/auth/auth.container";
import { StorePort } from "src/application/ports/store/store.port";
import { IMemberRepository } from "@repositories/i-member-repository";

const setSelectedCharacterRoute = new Hono();
const logger = createLogger("set-selected-character-route");

const setSelectedCharacterSchema = z.object({
    characterId: z.number(),
    character: z.record(z.any()),
});
type SetSelectedCharacterInput = z.infer<typeof setSelectedCharacterSchema>;

setSelectedCharacterRoute.post(
    "/",
    authMiddleware,
    createRoute<SetSelectedCharacterInput>(
        {
            functionName: "set-selected-character",
            inputSchema: setSelectedCharacterSchema,
        },
        async ({ c, input }) => {
            const user = c.get("user");
            if (!user) {
                throw new Error("User not authenticated");
            }

            const currentUserId = user.userId;
            const databaseClient =
                authContainer.resolve<DatabaseClient>("DatabaseClient");
            const memberRepository =
                authContainer.resolve<IMemberRepository>("MemberRepository");
            const { characterId } = input;

            const store = authContainer.resolve<StorePort>("RedisStore");
            const useCase = new SetSelectedCharacterUseCase(
                databaseClient,
                memberRepository,
                logger,
                store
            );
            await useCase.execute(currentUserId, characterId, input.character);

            return { ok: true };
        }
    )
);

export { setSelectedCharacterRoute };
