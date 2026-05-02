import { DatabaseClient } from "@database/database-client-factory";
import { MemberRepositoryError } from "@errors/member-repository-error";
import { createLogger } from "@infrastructure/logging/logger";
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
    private readonly logger = createLogger("CharacterReliabilityRepository");
    constructor(
        private readonly databaseClient: DatabaseClient, // Replace with actual database client type
    ) { }

    async getMultipleCharactersReliability(characters: { characterName: string; }[], realmSlug: string): Promise<ReliabilityScore[]> {
        this.logger.info(`Fetching reliability scores for ${characters.length} characters on ${realmSlug}...`);
        const { data, error } = await this.databaseClient
            .rpc('get_recent_raid_reliability_ratings', {
                p_character_names: characters.map(c => c.characterName.toLowerCase()),
                p_realm_slug: realmSlug.toLowerCase(),
            })

        if (error) {
            this.logger.error(`Failed to fetch reliability scores for characters on ${realmSlug}: ${error?.message}`);
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
        this.logger.info(`Reliability scores fetched successfully for ${reliabilityScores.length} characters on ${realmSlug}.`);
        return reliabilityScores;
    }

    async getCharacterReliability(characterName: string, realmSlug: string): Promise<ReliabilityScore> {
        this.logger.info(`Fetching reliability score for ${characterName} on ${realmSlug}...`);
        const { data, error } = await this.databaseClient
            .rpc('get_recent_raid_reliability_rating', {
                p_character_name: characterName.toLowerCase(),
                p_realm_slug: realmSlug.toLowerCase(),
            })
            .single<GetRecentRaidReliabilityRatingsResult>()

        if (error) {
            this.logger.error(`Failed to fetch reliability score for ${characterName} on ${realmSlug}: ${error.message}`);
            throw new MemberRepositoryError(`Failed to fetch reliability score for ${characterName} on ${realmSlug}: ${error.message}`);
        }

        this.logger.info(`Reliability score fetched successfully for ${characterName} on ${realmSlug}.`);
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