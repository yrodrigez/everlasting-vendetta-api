import { ICharacterEquipmentService } from "@repositories/gearscore/i-character-equipment-service";
import ITokenRepository from "@repositories/i-token-repository";
import pLimit from "p-limit";
import { IWowGuildService } from "../../domain/services/i-wow-guild-service";
import { createLogger } from "../../infrastructure/logging";
import {
    CharacterReliabilityPort,
    ReliabilityScore,
} from "../ports/character/character-reliability.port";
import { HighestGSPort } from "../ports/gear-score/highest-gs.port";
import { RRSCalculator } from "../ports/raid-resets/raid-readiness-score-calculator.port";
import { RaidResetsPort } from "../ports/raid-resets/raid-resets.port";
import {
    RaidResetParticipant,
    RaidResetsParticipantPort,
} from "../ports/raid-resets/reset-participants.port";
import { UserRegistrationWeeksPort } from "../ports/user/user-registration-weeks.port";
import { GearScoreResolver } from "../services/gear-score/gear-score-resolver";

export type CalculateResetRaidReadinessScoreUseCaseInput = {
    resetId: string;
};

export type CalculateResetRaidReadinessScoreUseCaseOutput = {
    resetId: string;
    participantScores: {
        characterName: string;
        realmSlug: string;
        isPriorityRole: boolean;
        isAlter: boolean;
        isFullEnchanted: boolean;
        coverageScore: number;
        weightedWeeklyScore: number;
        finalRecentReliability: number;
        opportunitiesConsidered: number;
        weeksConsidered: number;
        weeksSinceAccountCreation: number;
        rrs: number;
        multipliers: Record<string, number>;
        reliabilityAdjustment: {
            observedReliability: number;
            neutralReliability: number;
            confidence: number;
            neutralWeight: number;
            effectiveReliability: number;
            weeksConsidered: number;
            fullConfidenceAfterWeeks: number;
        };
    }[];
};

const PRIORITY_RANKS = new Set([
    "GUILD_MASTER",
    "RAID_LEADER",
    "RAID_LEAD",
    "RESP_COMRADE",
    "RESP_VETERAN",
    "RESP_RAIDER",
]);
const GUILD_NAME = "everlasting-vendetta";
const ROSTER_CACHE_TTL_MS = 25 * 60 * 1000;
const EQUIPMENT_FETCH_CONCURRENCY = 3;

type GuildRosterMember = Awaited<
    ReturnType<IWowGuildService["getGuildRoster"]>
>["members"][number];


export class CalculateResetRaidReadinessScoreUseCase {
    private readonly equipmentFetchLimit = pLimit(EQUIPMENT_FETCH_CONCURRENCY);
    private readonly logger = createLogger(
        "CalculateResetRaidReadinessScoreUseCase"
    );

    private static readonly rosterCache = new Map<
        string,
        { expiresAt: number; rosterByCharacter: Map<string, GuildRosterMember> }
    >();

    constructor(
        private readonly raidResetsPort: RaidResetsPort,
        private readonly characterEquipmentService: ICharacterEquipmentService,
        private readonly characterReliabilityPort: CharacterReliabilityPort,
        private readonly raidResetsParticipantPort: RaidResetsParticipantPort,
        private readonly rrsCalculator: RRSCalculator,
        private readonly tokenRepository: ITokenRepository,
        private readonly wowGuildService: IWowGuildService,
        private readonly userRegistrationWeeksPort: UserRegistrationWeeksPort,
        private readonly highestGSPort: HighestGSPort,
        private readonly gearScoreResolver: GearScoreResolver,
    ) { }

    async execute({
        resetId,
    }: CalculateResetRaidReadinessScoreUseCaseInput): Promise<CalculateResetRaidReadinessScoreUseCaseOutput> {
        this.logger.info(
            `Calculating raid readiness score for reset ${resetId}...`
        );
        const reset = await this.raidResetsPort.getResetCreatedBy(resetId);

        // Parse raid date and time
        const raidDateTime = new Date(`${reset.raidDate}T${reset.time}Z`); // Assumes UTC, adjust if needed based on timezone requirements
        this.logger.info(
            `Raid date and time parsed as ${raidDateTime.toISOString()}`
        );
        const participants = await this.raidResetsParticipantPort.getParticipantsByResetId(resetId);
        this.logger.info(`Fetched ${participants.length} participants for reset ${resetId}.`);
        const token = await this.tokenRepository.getCurrentToken();
        const rosterByCharacter = await this.getGuildRoster(
            reset.createdBy.realmSlug,
            token.access_token
        );

        const reliabilityByCharacter = await this.getReliabilityByCharacter(participants);

        const participantScores = await Promise.all(participants.map(async (participant) => {
            const characterName = participant.character.name;
            const realmSlug = participant.character.realmSlug;
            const characterKey = this.getCharacterKey(
                realmSlug,
                characterName
            );
            const rosterMember = rosterByCharacter.get(characterKey);
            const reliability = reliabilityByCharacter.get(characterKey) ?? this.getDefaultReliability(characterName, realmSlug);
            const highestGS = await this.highestGSPort.getHighestGS(
                characterName,
                realmSlug
            );
            let isFullEnchanted = highestGS?.details.isFullEnchanted === true;
            let isFullyGemmed = highestGS?.details.isFullyGemmed === true;

            if (!isFullEnchanted || !isFullyGemmed) {
                const equipment = await this.equipmentFetchLimit(() =>
                    this.characterEquipmentService.fetchEquipment(
                        characterName.toLowerCase(),
                        realmSlug.toLowerCase(),
                        token.access_token
                    )
                );

                const { isFullEnchanted: resolvedIsFullEnchanted, isFullyGemmed: resolvedIsFullyGemmed } = await this.gearScoreResolver.resolve({
                    characterName: equipment.characterName,
                    realmSlug,
                    equippedItems: equipment.equippedItems,
                });

                isFullEnchanted = isFullEnchanted || resolvedIsFullEnchanted;
                isFullyGemmed = isFullyGemmed || resolvedIsFullyGemmed;
            }
            const isPriorityRole = this.isPriorityRole(rosterMember);
            const isAlter = rosterMember?.rank?.isAlt ?? false;
            const userRegistrationWeeks = await this.userRegistrationWeeksPort.getUserRegistrationWeeks(participant.character.userId);
            if (!userRegistrationWeeks && userRegistrationWeeks !== 0) {
                throw new Error(`Failed to fetch registration weeks for user ${participant.character.userId}`);
            }
            const { rrs, multipliers, reliabilityAdjustment } = this.rrsCalculator.calculateReadinessScore({
                characterName,
                realmSlug,
                weeksSinceAccountCreation: userRegistrationWeeks.weeksSinceRegistration,
                raidReliabilityRating: reliability.finalRecentReliability,
                isFullEnchanted,
                isPriorityRole,
                isAlter,
                signedUpAt: participant.participationCreatedAt,
                raidDateTime,
                isFullyGemmed,
            });

            return {
                characterName,
                realmSlug,
                isPriorityRole,
                isAlter,
                isFullEnchanted,
                coverageScore: reliability.coverageScore,
                weightedWeeklyScore: reliability.weightedWeeklyScore,
                finalRecentReliability: reliability.finalRecentReliability,
                opportunitiesConsidered: reliability.opportunitiesConsidered,
                weeksConsidered: reliability.weeksConsidered,
                weeksSinceAccountCreation: userRegistrationWeeks.weeksSinceRegistration,
                rrs,
                multipliers,
                reliabilityAdjustment,
            };
        }));

        return {
            resetId,
            participantScores,
        };
    }

    private async getGuildRoster(
        realmSlug: string,
        token: string
    ): Promise<Map<string, GuildRosterMember>> {
        this.logger.info(`Fetching guild roster for realm ${realmSlug}...`);
        const normalizedRealmSlug = realmSlug.trim().toLowerCase();
        const cacheKey = this.getRosterCacheKey(normalizedRealmSlug);
        const cached =
            CalculateResetRaidReadinessScoreUseCase.rosterCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.rosterByCharacter;
        }

        const rosterByCharacter = new Map<string, GuildRosterMember>();

        const roster = await this.wowGuildService.getGuildRoster(
            normalizedRealmSlug,
            GUILD_NAME,
            token
        );
        this.logger.info(`Fetched guild roster for realm ${realmSlug}.`);

        for (const member of roster.members) {
            rosterByCharacter.set(
                this.getCharacterKey(member.realm.slug, member.name),
                member
            );
        }

        CalculateResetRaidReadinessScoreUseCase.rosterCache.set(cacheKey, {
            expiresAt: Date.now() + ROSTER_CACHE_TTL_MS,
            rosterByCharacter,
        });

        return rosterByCharacter;
    }

    private getRosterCacheKey(realmSlug: string): string {
        return `${realmSlug}:${GUILD_NAME}`;
    }

    private async getReliabilityByCharacter(
        participants: RaidResetParticipant[]
    ): Promise<Map<string, ReliabilityScore>> {
        const reliabilityByCharacter = new Map<string, ReliabilityScore>();
        const participantsByRealm = participants.reduce((acc, participant) => {
            const realmSlug = participant.character.realmSlug;
            acc.set(realmSlug, [...(acc.get(realmSlug) ?? []), participant]);
            return acc;
        }, new Map<string, RaidResetParticipant[]>());

        await Promise.all(
            [...participantsByRealm.entries()].map(
                async ([realmSlug, realmParticipants]) => {
                    const reliabilityScores =
                        await this.characterReliabilityPort.getMultipleCharactersReliability(
                            realmParticipants.map((participant) => ({
                                characterName: participant.character.name,
                            })),
                            realmSlug
                        );

                    for (const reliability of reliabilityScores) {
                        reliabilityByCharacter.set(
                            this.getCharacterKey(
                                reliability.realmSlug,
                                reliability.characterName
                            ),
                            reliability
                        );
                    }
                }
            )
        );

        return reliabilityByCharacter;
    }

    private isPriorityRole(rosterMember?: GuildRosterMember): boolean {
        const rankName = rosterMember?.rank?.name;
        if (!rankName) return false;

        const normalizedRankName = rankName
            .trim()
            .replace(/[\s-]+/g, "_")
            .toUpperCase();
        return PRIORITY_RANKS.has(normalizedRankName);
    }

    private getDefaultReliability(
        characterName: string,
        realmSlug: string
    ): ReliabilityScore {
        return {
            characterName,
            realmSlug,
            finalRecentReliability: 1,
            coverageScore: 0,
            weightedWeeklyScore: 0,
            weeksConsidered: 0,
            opportunitiesConsidered: 0,
        };
    }

    private getCharacterKey(realmSlug: string, characterName: string): string {
        return `${realmSlug.trim().toLowerCase()}:${characterName.trim().toLowerCase()}`;
    }
}
