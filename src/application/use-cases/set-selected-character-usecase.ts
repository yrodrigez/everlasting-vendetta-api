import { DatabaseClient } from "@database/database-client-factory";
import { Logger } from "@infrastructure/logging";
import { MemberRepository } from "@infrastructure/repositories/member-repository";

export class SetSelectedCharacterUseCase {
    constructor(
        private readonly databaseClient: DatabaseClient,
        private readonly memberRepository: MemberRepository,
        private readonly logger: Logger
    ) { }
    async execute(userId: string, characterId: number): Promise<void> {
        this.logger.info(`Setting selected character for user ${userId} to character ${characterId}`);

        // Verify that the character belongs to the user
        const members = await this.memberRepository.findAllByUserId(userId);
        if (!members || members.length === 0) {
            this.logger.error(`Member not found for user ${userId}`);
            throw new Error('Member not found');
        }
        const characterBelongsToUser = members.some(member => member.id === characterId);
        if (!characterBelongsToUser) {
            this.logger.error(`Character ${characterId} does not belong to user ${userId}`);
            throw new Error('Character does not belong to user');
        }

        const { error: deselectError } = await this.databaseClient
            .from('ev_member')
            .update({ is_selected: false })
            .eq('user_id', userId)
            .eq('is_selected', true);

        if (deselectError) {
            this.logger.error(`Failed to deselect current character for user ${userId}: ${deselectError.message}`);
            throw new Error('Failed to update selected character');
        }

        // Update the member record to set the selected character
        const { error } = await this.databaseClient
            .from('ev_member')
            .update({ is_selected: true })
            .eq('user_id', userId)
            .eq('id', characterId);

        if (error) {
            this.logger.error(`Failed to set selected character for user ${userId}: ${error.message}`);
            throw new Error('Failed to set selected character');
        }
        
        this.logger.info(`Successfully set selected character for user ${userId} to character ${characterId}`);
    }
}