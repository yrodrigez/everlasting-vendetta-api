import { createRoute } from "@http/hono-adapter";
import { SetSelectedCharacterUseCase } from "@use-cases/set-selected-character-usecase";
import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod/v3";

const setSelectedCharacterSchema = z.object({
    characterId: z.number(),
    character: z.record(z.any()),
});
type SetSelectedCharacterInput = z.infer<typeof setSelectedCharacterSchema>;

export function buildSetSelectedCharacterRoute(
    useCase: SetSelectedCharacterUseCase,
    authMiddleware: MiddlewareHandler
) {
    const setSelectedCharacterRoute = new Hono();

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

                await useCase.execute(
                    user.userId,
                    input.characterId,
                    input.character
                );

                return { ok: true };
            }
        )
    );

    return setSelectedCharacterRoute;
}
