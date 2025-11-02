import { type RouteContext } from "@http/hono-adapter";
import {
    type CharacterAvatarParams,
    type CharacterAvatarQuery,
} from "@http/validators/schemas/wow-routes-schemas";
import {
    type GetCharacterAvatarOutput,
    GetCharacterAvatarUseCase,
} from "@use-cases/get-character-avatar-usecase";

export class CharacterAvatarController {
    constructor(
        private readonly characterAvatarUseCase: GetCharacterAvatarUseCase,
    ) { }

    async handle(
        ctx: RouteContext<unknown, CharacterAvatarQuery, CharacterAvatarParams>,
    ): Promise<GetCharacterAvatarOutput> {
        const { params, query } = ctx;
        const forceRefresh = this.normalizeForceFlag(query.force);

        return this.characterAvatarUseCase.execute({
            characterName: params.name,
            realmSlug: params.realm,
            forceRefresh,
        });
    }

    private normalizeForceFlag(value?: string | null): boolean {
        if (!value) return false;
        const normalized = value.trim().toLowerCase();
        return normalized === "true" || normalized === "1" || normalized === "yes";
    }
}
