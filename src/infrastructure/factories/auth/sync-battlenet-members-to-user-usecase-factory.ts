import { DatabaseClientFactory } from "@database/database-client-factory";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import WowAccountService from "@external/wow-account-service";
import { WowCharacterService } from "@external/wow-character-service";
import { MemberRepository } from "@infrastructure/repositories/member-repository";
import { RealmsRepository } from "@infrastructure/repositories/realms-repository";
import { WowAccountRepository } from "@infrastructure/repositories/wow-account-repository";
import { SyncBattlenetMembersToUserUsecase } from "@use-cases/sync-battlenet-members-to-user-usecase";

export class SyncBattlenetMembersToUserUsecaseFactory {
    static make(token: string) {

        const databaseClient = DatabaseClientFactory.getInstance();
        const blizzardOAuthService = new BlizzardOauthService();
        const wowAccountService = new WowAccountService();
        const characterService = new WowCharacterService(token);
        const memberRepository = new MemberRepository(databaseClient);
        const wowAccountRepository = new WowAccountRepository(databaseClient);
        const realmsRepository = new RealmsRepository(databaseClient);
        
        return new SyncBattlenetMembersToUserUsecase(
            blizzardOAuthService,
            wowAccountService,
            characterService,
            memberRepository,
            wowAccountRepository,
            realmsRepository
        );
    }
}