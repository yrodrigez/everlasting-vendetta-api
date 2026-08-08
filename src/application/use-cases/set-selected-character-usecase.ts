import { AuthError } from "@errors/auth-error";
import { Logger } from "@infrastructure/logging";
import { IMemberRepository } from "@repositories/i-member-repository";
import { StorePort } from "src/application/ports/store/store.port";

type SelectedCharacterMetadata = {
    realm?: {
        slug?: string | null;
    } | null;
    character?: {
        realm?: {
            slug?: string | null;
        } | null;
    } | null;
};

export class SetSelectedCharacterUseCase {
    constructor(
        private readonly memberRepository: IMemberRepository,
        private readonly logger: Logger,
        private readonly store: StorePort
    ) {}
    async execute(
        userId: string,
        characterId: number,
        metadata: Record<string, any>
    ): Promise<void> {
        this.logger.info(
            `Setting selected character for user ${userId} to character ${characterId} with metadata ${JSON.stringify(metadata)}`
        );

        void this.verifyCharacterRealm(metadata);

        // Verify that the character belongs to the user
        const members = await this.memberRepository.findAllByUserId(userId);
        if (!members || members.length === 0) {
            this.logger.error(`Member not found for user ${userId}`);
            throw new Error("Member not found");
        }
        const characterBelongsToUser = members.some(
            (member) => member.id === characterId
        );
        if (!characterBelongsToUser) {
            this.logger.error(
                `Character ${characterId} does not belong to user ${userId}`
            );
            throw new Error("Character does not belong to user");
        }

        const alreadySelectedCharacter = members.find(
            (member) => member.is_selected && member.id === characterId
        );

        if (alreadySelectedCharacter) {
            await this.store.set(`selected_character:${userId}`, metadata, 0);
            this.logger.info(
                `Character ${characterId} is already selected for user ${userId}`
            );
            return;
        }

        await this.memberRepository.setSelectedCharacterForUser({
            userId,
            characterId,
        });

        await this.store.set(`selected_character:${userId}`, metadata, 0);

        this.logger.info(
            `Successfully set selected character for user ${userId} to character ${characterId} with metadata ${JSON.stringify(metadata)}`
        );
    }

    private verifyCharacterRealm(metadata: SelectedCharacterMetadata): void {
        const realmSlug =
            metadata.realm?.slug ?? metadata.character?.realm?.slug ?? "";

        if (realmSlug.trim().length > 0) {
            return;
        }

        throw new AuthError(
            "Selected character is missing realm",
            "SELECTED_CHARACTER_MISSING_REALM",
            400
        );
    }
}
