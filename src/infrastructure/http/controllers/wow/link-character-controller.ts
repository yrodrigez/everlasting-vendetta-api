import { RouteContext } from "@http/hono-adapter";
import { LinkCharacterUseCaseFactory } from "@infrastructure/factories/wow/link-character-usecase-factory";

export class LinkCharacterController {
    async handle({ input: { characterName, realmSlug }, c: context }: RouteContext<{
        characterName: string;
        realmSlug: string;
    }>) {
        const user = context.get("user");
        const userId = user?.userId;
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const usecase = await LinkCharacterUseCaseFactory.make();
        return usecase.execute({
            userId,
            characterName,
            realmSlug,
        });
    }
}