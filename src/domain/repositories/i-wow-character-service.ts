import { WoWCharacter } from "../entities/wow/wow-character.ts";

export interface IWowCharacterService {
    getCharacterAvatar(
        realmSlug: string,
        characterName: string,
        token: string
    ): Promise<string>;
    getCharacter(
        realmSlug: string,
        characterName: string,
        token: string
    ): Promise<WoWCharacter>;
    getCharacterWithAvatar(
        realmSlug: string,
        characterName: string,
        token: string
    ): Promise<WoWCharacter>;
}
