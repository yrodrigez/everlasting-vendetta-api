import { DatabaseClientFactory } from "@database/database-client-factory";
import { AuthRepository } from "@infrastructure/repositories/auth-repository";
import { LinkOAuthAccountUseCase } from "@use-cases/link-oauth-account-usecase";
import { SyncBattlenetMembersToUserUsecaseFactory } from "./sync-battlenet-members-to-user-usecase-factory";
import { SyncMembersToNewUserUseCaseFactory } from "./sync-members-to-new-user-usecase-factory";
import { DiscordApi } from "@external/discord-api";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";

export class LinkOAuthAccountUseCaseFactory {
    static make(): LinkOAuthAccountUseCase {
        const databaseClient = DatabaseClientFactory.getInstance();
        const repo = new AuthRepository(databaseClient);

        const syncBattlenetMembersToUserUsecase = SyncBattlenetMembersToUserUsecaseFactory.make();
        const syncMembersToNewUserUseCase = SyncMembersToNewUserUseCaseFactory.make();
        const discordApiClient = new DiscordApi();
        const blizzardOAuthService = new BlizzardOauthService();

        return new LinkOAuthAccountUseCase(repo, syncBattlenetMembersToUserUsecase, syncMembersToNewUserUseCase, discordApiClient, blizzardOAuthService);
    }
} 