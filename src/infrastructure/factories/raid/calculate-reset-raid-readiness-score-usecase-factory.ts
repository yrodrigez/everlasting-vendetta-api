import { DatabaseClientFactory } from "@database/database-client-factory";
import { CharacterEquipmentService } from "@external/character-equipment-service";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { WowGuildService } from "@external/wow-guild-service";
import { CharacterReliabilityRepository } from "@infrastructure/repositories/character-reliability.repository";
import { RaidResetParticipantsRepository } from "@infrastructure/repositories/raid-reset-participants.repository";
import { RaidResetsRepository } from "@infrastructure/repositories/raid-resets.repository";
import { BlizzardTokenRepository } from "@infrastructure/repositories/blizzard-token-repository";
import { UserRegistrationWeeksRepository } from "@infrastructure/repositories/user-registration-weeks.repository";
import { GearScoreCacheRepository } from "@infrastructure/repositories/gearscore-cache-repository";
import { HighestGSRepository } from "@infrastructure/repositories/highest-gs-repository";
import { RaidReadinessScoreCalculatorService } from "@infrastructure/services/raid-reliability-calculator.service";
import { ItemService } from "@external/item-service";
import { GearScoreResolver } from "../../../application/services/gear-score/gear-score-resolver";
import { CalculateResetRaidReadinessScoreUseCase } from "@use-cases/calculate-reset-raid-readiness-score.usecase";

export class CalculateResetRaidReadinessScoreUseCaseFactory {
    static make(): CalculateResetRaidReadinessScoreUseCase {
        const databaseClient = DatabaseClientFactory.getInstance();
        const blizzardOauthService = new BlizzardOauthService();
        const tokenRepository = new BlizzardTokenRepository(
            databaseClient,
            blizzardOauthService
        );
        const cacheRepository = new GearScoreCacheRepository(databaseClient);
        const highestGSRepository = new HighestGSRepository(databaseClient);
        const itemService = new ItemService(databaseClient);

        const gearScoreResolver = new GearScoreResolver(
            cacheRepository,
            itemService,
            highestGSRepository
        );

        return new CalculateResetRaidReadinessScoreUseCase(
            new RaidResetsRepository(databaseClient),
            new CharacterEquipmentService(),
            new CharacterReliabilityRepository(databaseClient),
            new RaidResetParticipantsRepository(databaseClient),
            new RaidReadinessScoreCalculatorService(),
            tokenRepository,
            new WowGuildService(),
            new UserRegistrationWeeksRepository(databaseClient),
            highestGSRepository,
            gearScoreResolver
        );
    }
}
