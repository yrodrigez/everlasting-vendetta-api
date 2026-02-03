import { WoWCharacter } from "@entities/wow/wow-character";

export interface ICharacterValidationService {
    validateRealm(realmSlug: string): Promise<boolean>;
    validateCharacterExists(
        realmSlug: string,
        characterName: string,
        accessToken: string,
    ): Promise<WoWCharacter>;
    isCharacterAvailable(
        characterId: number,
        currentUserId: string,
    ): Promise<{
        available: boolean;
        takenBy?: string;
        alreadyLinkedByUser: boolean;
    }>;
}