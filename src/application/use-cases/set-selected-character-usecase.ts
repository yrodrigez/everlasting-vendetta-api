import { DatabaseClient } from "@database/database-client-factory";
import { Logger } from "@infrastructure/logging";
import { IMemberRepository } from "@repositories/i-member-repository";
import { StorePort } from "src/application/ports/store/store.port";

export class SetSelectedCharacterUseCase {
    constructor(
        private readonly databaseClient: DatabaseClient,
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

        const { error: deselectError } = await this.databaseClient
            .from("ev_member")
            .update({ is_selected: false })
            .eq("user_id", userId)
            .eq("is_selected", true);

        if (deselectError) {
            this.logger.error(
                `Failed to deselect current character for user ${userId}: ${deselectError.message}`
            );
            throw new Error("Failed to update selected character");
        }

        // Update the member record to set the selected character
        const { error } = await this.databaseClient
            .from("ev_member")
            .update({ is_selected: true })
            .eq("user_id", userId)
            .eq("id", characterId);

        if (error) {
            this.logger.error(
                `Failed to set selected character for user ${userId}: ${error.message}`
            );
            throw new Error("Failed to set selected character");
        }

        await this.store.set(`selected_character:${userId}`, metadata, 0);

        this.logger.info(
            `Successfully set selected character for user ${userId} to character ${characterId} with metadata ${JSON.stringify(metadata)}`
        );
    }
}
