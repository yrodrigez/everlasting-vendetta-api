import { DatabaseClientFactory } from "@database/database-client-factory";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { WowCharacterService } from "@external/wow-character-service";
import { WowCharacterController } from "@http/controllers/wow/wow-character-controller";
import { GetWowCharacterUseCase } from "@use-cases/get-wow-character-usecase";
import { BlizzardTokenRepository } from "src/infrastructure/repositories/blizzard-token-repository";
import { MemberRepository } from "src/infrastructure/repositories/member-repository";

export class WowCharacterUseCaseFactory {
    static make(): WowCharacterController {
        const databaseClient = DatabaseClientFactory.getInstance();
        const memberRepository = new MemberRepository(databaseClient);
        const blizzardOauthService = new BlizzardOauthService();
        const tokenRepository = new BlizzardTokenRepository(
            databaseClient,
            blizzardOauthService,
        );

        const useCase = new GetWowCharacterUseCase(
            memberRepository,
            tokenRepository,
            (accessToken) => new WowCharacterService(accessToken),
        );

        return new WowCharacterController(useCase);
    }
}
