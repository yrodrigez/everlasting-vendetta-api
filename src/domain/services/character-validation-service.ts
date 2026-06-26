import { IMemberRepository } from "@repositories/i-member-repository";
import { WoWCharacter } from "@entities/wow/wow-character";
import { BlizzardApiError } from "@errors/blizzard-api-error";
import { createLogger } from "@infrastructure/logging";
import { IWowCharacterService } from "@repositories/i-wow-character-service";
import { ICharacterValidationService } from "./i-character-validation-service";
import { IRealmsRepository } from "@repositories/i-realms-repository";

export class CharacterValidationService implements ICharacterValidationService {
    private readonly logger = createLogger("CharacterValidationService");

    constructor(
        private readonly characterService: IWowCharacterService,
        private readonly memberRepository: IMemberRepository,
        private readonly realmsRepository: IRealmsRepository
    ) {}

    async validateRealm(realmSlug: string): Promise<boolean> {
        const allowedRealms = await this.realmsRepository.getAllowedRealms();
        const isValid = allowedRealms.some((realm) => realm.slug === realmSlug);
        this.logger.info(`Realm validation for '${realmSlug}': ${isValid}`);
        return isValid;
    }

    async validateCharacterExists(
        realmSlug: string,
        characterName: string,
        accessToken: string
    ): Promise<WoWCharacter> {
        try {
            const character =
                await this.characterService.getCharacterWithAvatar(
                    realmSlug,
                    characterName,
                    accessToken
                );
            this.logger.info(
                `Character ${characterName} on realm ${realmSlug} validated successfully`
            );
            return character;
        } catch (error) {
            this.logger.error(
                `Error validating character ${characterName} on realm ${realmSlug}`,
                error
            );
            if (error instanceof BlizzardApiError) {
                throw error;
            }
            throw new BlizzardApiError(
                `Failed to validate character: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }

    async isCharacterAvailable(
        characterId: number,
        currentUserId: string
    ): Promise<{
        available: boolean;
        takenBy?: string;
        alreadyLinkedByUser: boolean;
    }> {
        try {
            const existingMember =
                await this.memberRepository.findById(characterId);

            // Character not in system yet
            if (!existingMember) {
                return {
                    available: true,
                    alreadyLinkedByUser: false,
                };
            }

            // Character exists in system
            if (existingMember.userId) {
                // Same user already linked it
                if (existingMember.userId === currentUserId) {
                    return {
                        available: true,
                        alreadyLinkedByUser: true,
                    };
                }

                // Different user has it linked
                return {
                    available: false,
                    takenBy: existingMember.userId,
                    alreadyLinkedByUser: false,
                };
            }

            // Character exists but has no user (shouldn't happen but handle it)
            return {
                available: true,
                alreadyLinkedByUser: false,
            };
        } catch (error) {
            this.logger.error(
                `Error checking character availability for ID ${characterId}`,
                error
            );
            throw error;
        }
    }
}
