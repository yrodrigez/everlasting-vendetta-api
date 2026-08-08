import { LinkCharacterToUserUseCase } from "@use-cases/link-character-to-user";

export class LinkCharacterController {
    constructor(
        private readonly linkCharacterToUserUseCase: LinkCharacterToUserUseCase
    ) {}

    async handle({
        userId,
        characterName,
        realmSlug,
    }: {
        userId: string;
        characterName: string;
        realmSlug: string;
    }) {
        return this.linkCharacterToUserUseCase.execute({
            userId,
            characterName,
            realmSlug,
        });
    }
}
