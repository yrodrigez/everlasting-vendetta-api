import { DatabaseClientFactory } from "@database/database-client-factory";
import { SQLDatabaseClientFactory } from "@database/sql/sql-database-client-factory";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { WowCharacterService } from "@external/wow-character-service";
import { CharacterAvatarController } from "@http/controllers/wow/character-avatar-controller";
import { GetCharacterAvatarUseCase } from "@use-cases/get-character-avatar-usecase";
import { BlizzardTokenRepository } from "src/infrastructure/repositories/blizzard-token-repository";
import { MemberRepository } from "src/infrastructure/repositories/member-repository";

export class CharacterAvatarUseCaseFactory {
    static make() {
        const databaseClient = DatabaseClientFactory.getInstance();
        const sqlDatabaseClient = SQLDatabaseClientFactory.getInstance();
        const memberRepository = new MemberRepository(
            databaseClient,
            sqlDatabaseClient
        );
        const blizzardOauthService = new BlizzardOauthService();
        const tokenRepository = new BlizzardTokenRepository(
            databaseClient,
            blizzardOauthService
        );

        const wowCharacterService = new WowCharacterService();
        const useCase = new GetCharacterAvatarUseCase(
            memberRepository,
            tokenRepository,
            wowCharacterService
        );

        return new CharacterAvatarController(useCase);
    }
}
