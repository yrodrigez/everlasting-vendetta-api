import { type RouteContext } from "@http/hono-adapter";
import {
    type WowCharacterParams,
    type WowCharacterQuery,
} from "@http/validators/schemas/wow-routes-schemas";
import {
    type GetWowCharacterOutput,
    GetWowCharacterUseCase,
} from "@use-cases/get-wow-character-usecase";

export class WowCharacterController {
    constructor(
        private readonly getWowCharacterUseCase: GetWowCharacterUseCase,
    ) {}

    async handle(
        ctx: RouteContext<unknown, WowCharacterQuery, WowCharacterParams>,
    ): Promise<GetWowCharacterOutput> {
        const { params, query } = ctx;
        const forceRefresh = this.normalizeForceFlag(query.force);

        return this.getWowCharacterUseCase.execute({
            realmSlug: params.realm,
            characterName: params.name,
            forceRefresh,
        });
    }

    private normalizeForceFlag(value?: string | null): boolean {
        if (!value) return false;
        const normalized = value.trim().toLowerCase();
        return normalized === "true" || normalized === "1" || normalized === "yes";
    }
}
