import { CharacterAppearance } from "@dto/wow/character-appearance";

export interface CharacterAppearancePort {
    getCharacterAppearance(characterId: number): Promise<CharacterAppearance>;
}
