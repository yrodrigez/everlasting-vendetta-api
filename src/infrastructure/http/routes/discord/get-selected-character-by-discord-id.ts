import { createRoute } from "@http/hono-adapter";
import { Hono } from "hono";
import { DatabaseClientFactory } from "@database/database-client-factory";
import { MemberRepository } from "@infrastructure/repositories/member-repository";
import { AuthRepository } from "@infrastructure/repositories/auth-repository";
import { GetSelectedCharacterByDiscordIdUseCase } from "@use-cases/get-selected-character-by-discord-id-usecase";
import { z } from "zod/v3";
import { authMiddleware } from "@http/middleware/auth.middleware";

const getSelectedCharacterByDiscordIdRoute = new Hono();

const paramsSchema = z.object({
    discordId: z.string().min(1),
});
type Params = z.infer<typeof paramsSchema>;

getSelectedCharacterByDiscordIdRoute.get(
    "/",
    authMiddleware,
    createRoute<unknown, unknown, unknown, Params>(
        {
            functionName: "get-selected-character-by-discord-id",
            paramsSchema,
        },
        async ({ params }) => {
            const databaseClient = DatabaseClientFactory.getInstance();
            const authRepository = new AuthRepository(databaseClient);
            const memberRepository = new MemberRepository(databaseClient);

            const useCase = new GetSelectedCharacterByDiscordIdUseCase(
                authRepository,
                memberRepository
            );

            const selectedCharacter = await useCase.execute(params.discordId);

            return selectedCharacter;
        }
    )
);

export { getSelectedCharacterByDiscordIdRoute };
