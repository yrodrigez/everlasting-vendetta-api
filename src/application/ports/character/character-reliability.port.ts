export type ReliabilityScore = {
    finalRecentReliability: number
    coverageScore: number
    weightedWeeklyScore: number
    weeksConsidered: number
    opportunitiesConsidered: number
    characterName: string
    realmSlug: string
}
export interface CharacterReliabilityPort {
    getCharacterReliability(characterName: string, realmSlug: string): Promise<ReliabilityScore>
    getMultipleCharactersReliability(characters: { characterName: string, }[], realmSlug: string): Promise<ReliabilityScore[]>
}