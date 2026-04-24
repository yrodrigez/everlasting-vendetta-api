import { DatabaseClient } from "@database/database-client-factory";
import { MemberRepositoryError } from "@errors/member-repository-error";
import { CharacterReliabilityPort, ReliabilityScore } from "src/application/ports/character/character-reliability.port";
type GetRecentRaidReliabilityRatingsResult = {
    character_name: string
    coverage_score: number
    weekly_presence_score: number
    weighted_weekly_score: number
    final_recent_reliability: number
    weeks_considered: number
    opportunities_considered: number
}
export class CharacterReliabilityRepository implements CharacterReliabilityPort {
    constructor(
        private readonly databaseClient: DatabaseClient, // Replace with actual database client type
    ) { }

    async getMultipleCharactersReliability(characters: { characterName: string; }[], realmSlug: string): Promise<ReliabilityScore[]> {
        const { data, error } = await this.databaseClient
            .rpc('get_recent_raid_reliability_ratings', {
                p_character_names: characters.map(c => c.characterName.toLowerCase()),
                p_realm_slug: realmSlug.toLowerCase(),
            })

        if (error) {
            throw new MemberRepositoryError(`Failed to fetch reliability scores for characters on ${realmSlug}: ${error?.message}`);
        }

        const reliabilityScores: ReliabilityScore[] = data?.map((item: GetRecentRaidReliabilityRatingsResult) => ({
            characterName: item.character_name,
            finalRecentReliability: Number(item.final_recent_reliability || 1),
            coverageScore: Number(item.coverage_score ?? 0),
            weightedWeeklyScore: Number(item.weighted_weekly_score ?? 0),
            weeksConsidered: Number(item.weeks_considered ?? 0),
            opportunitiesConsidered: Number(item.opportunities_considered ?? 0),
            realmSlug: realmSlug,
        })) || [];

        return reliabilityScores;
    }

    async getCharacterReliability(characterName: string, realmSlug: string): Promise<ReliabilityScore> {
        const { data, error } = await this.databaseClient
            .rpc('get_recent_raid_reliability_rating', {
                p_character_name: characterName.toLowerCase(),
                p_realm_slug: realmSlug.toLowerCase(),
            })
            .single<GetRecentRaidReliabilityRatingsResult>()

        if (error) {
            throw new MemberRepositoryError(`Failed to fetch reliability score for ${characterName} on ${realmSlug}: ${error.message}`);
        }

        return {
            characterName: characterName,
            finalRecentReliability: Number(data?.final_recent_reliability || 1),
            coverageScore: Number(data?.coverage_score ?? 0),
            weightedWeeklyScore: Number(data?.weighted_weekly_score ?? 0),
            weeksConsidered: Number(data?.weeks_considered ?? 0),
            opportunitiesConsidered: Number(data?.opportunities_considered ?? 0),
            realmSlug: realmSlug,
        }
    }
}