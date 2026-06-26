import {
    CharacterReliabilityPort,
    ReliabilityScore,
} from "src/application/ports/character/character-reliability.port";

export class CharacterReliabilityRepository implements CharacterReliabilityPort {
    getCharacterReliability(
        characterName: string,
        realmSlug: string
    ): Promise<ReliabilityScore> {
        throw new Error("Method not implemented.");
    }
    getMultipleCharactersReliability(
        characters: { characterName: string }[],
        realmSlug: string
    ): Promise<ReliabilityScore[]> {
        throw new Error("Method not implemented.");
    }
}
