import { DatabaseClientFactory } from "@database/database-client-factory";
import { CharacterValidationService } from "@domain/services/character-validation-service";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { WowCharacterService } from "@external/wow-character-service";
import { BlizzardTokenRepository } from "@infrastructure/repositories/blizzard-token-repository";
import { MemberRepository } from "@infrastructure/repositories/member-repository";
import { RealmsRepository } from "@infrastructure/repositories/realms-repository";
import { LinkCharacterToUserUseCase } from "@use-cases/link-character-to-user";
import { EventTrackingService } from "@infrastructure/services/event-tracking-service";

export class LinkCharacterUseCaseFactory {
    static async make() {
        const databaseClient = DatabaseClientFactory.getInstance();
        const memberRepository = new MemberRepository(databaseClient);
        const realmsRepository = new RealmsRepository(databaseClient);
        const blizzardOauthService = new BlizzardOauthService();
        const tokenRepository = new BlizzardTokenRepository(
            databaseClient,
            blizzardOauthService,
        );
        
        const characterService = new WowCharacterService();

        const characterValidationService = new CharacterValidationService(characterService, memberRepository, realmsRepository);

        const eventTracker = new EventTrackingService();

        return new LinkCharacterToUserUseCase(
            memberRepository,
            characterValidationService,
            tokenRepository,
            eventTracker,
        );
    }
}