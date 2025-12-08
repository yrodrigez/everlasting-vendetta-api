import { DatabaseClientFactory } from "@database/database-client-factory";
import { CharacterValidationService } from "@domain/services/character-validation-service";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { WowCharacterService } from "@external/wow-character-service";
import { BlizzardTokenRepository } from "@infrastructure/repositories/blizzard-token-repository";
import { MemberRepository } from "@infrastructure/repositories/member-repository";
import { RealmsRepository } from "@infrastructure/repositories/realms-repository";
import { LinkCharacterToUserUseCase } from "@use-cases/link-character-to-user";

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
        const token = await tokenRepository.getCurrentToken()
        const characterService = new WowCharacterService(token.access_token);

        const characterValidationService = new CharacterValidationService(characterService, memberRepository, realmsRepository);

        return new LinkCharacterToUserUseCase(memberRepository, characterValidationService);
    }
}