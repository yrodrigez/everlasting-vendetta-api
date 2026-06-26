import { IBlizzardOAuthService } from "@domain/services/i-blizzard-oauth-service";
import { Provider } from "@dto/auth/provider";
import { LinkOAuthAccount } from "@entities/auth/link-oauth-account";
import { createLogger } from "@infrastructure/logging";
import { IAuthRepository } from "@repositories/i-auth-repository";
import { IDiscordApiClient } from "@repositories/i-discord-api-client";
import { SyncBattlenetMembersToUserUsecase } from "./sync-battlenet-members-to-user-usecase";
import { SyncMembersToNewUserUseCase } from "./sync-members-to-new-user-usecase";

export class LinkOAuthAccountUseCase {
    private readonly logger = createLogger("LinkOAuthAccountUseCase");

    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly syncBattlenetMembersToUserUsecase: SyncBattlenetMembersToUserUsecase,
        private readonly syncMembersToNewUserUseCase: SyncMembersToNewUserUseCase,
        private readonly discordApiClient: IDiscordApiClient,
        private readonly blizzardOAuthService: IBlizzardOAuthService
    ) {}
    async execute({
        userId,
        accessToken,
        provider,
        refreshToken,
        tokenExpiresAt,
    }: {
        userId: string;
        accessToken: string;
        provider: Provider;
        refreshToken?: string;
        tokenExpiresAt?: Date;
    }) {
        this.logger.info(
            `Linking OAuth account for user ID: ${userId} with provider: ${provider}`
        );

        let providerUserId: string;
        let providerUsername: string;
        let providerEmail: string | null = null;
        let metadata: Record<string, any> = {};

        if (provider === "discord_oauth") {
            const discordUserInfo =
                await this.discordApiClient.getDiscordUserInfo(accessToken);
            if (!discordUserInfo) {
                throw new Error("Invalid or expired Discord access token");
            }
            providerUserId = discordUserInfo.id;
            providerUsername = discordUserInfo.username;
        } else if (provider.indexOf("bnet_oauth") !== -1) {
            const isValid =
                await this.blizzardOAuthService.checkTokenValidity(accessToken);
            if (!isValid) {
                throw new Error("Invalid or expired Battle.net access token");
            }
            const bnetUserInfo =
                await this.blizzardOAuthService.getUserInfo(accessToken);
            providerUserId = bnetUserInfo.id.toString();
            providerUsername = bnetUserInfo.battletag;
        } else {
            throw new Error(`Unsupported OAuth provider: ${provider}`);
        }

        const oldOauthProvider =
            await this.authRepository.findUserByProviderUserId(
                providerUserId,
                provider as Provider
            );
        if (oldOauthProvider && oldOauthProvider.userId !== userId) {
            this.logger.info(
                `OAuth account already linked to another user ID: ${oldOauthProvider.userId}. Merging accounts.`
            );
        }

        const newOauthProvider = await this.authRepository.linkOAuthAccount(
            new LinkOAuthAccount({
                userId,
                provider: provider,
                providerUserId,
                providerEmail: providerEmail || "",
                providerUsername,
                accessToken: accessToken,
                refreshToken: refreshToken || "",
                expiresAt: tokenExpiresAt || new Date(Date.now()),
                metadata,
            })
        );

        this.logger.info(
            `Successfully linked OAuth account for user ID: ${userId} with provider: ${provider}`
        );

        if (provider.indexOf("bnet_oauth") !== -1) {
            this.logger.info(
                `Syncing Battle.net members for user ID: ${userId} after linking OAuth account.`
            );
            const characters =
                await this.syncBattlenetMembersToUserUsecase.execute(
                    userId,
                    accessToken
                );
            return {
                ...newOauthProvider,
                characters,
            };
        }

        if (oldOauthProvider) {
            // this case is discord, we need to sync members from old oauth to new one because discord had members linked
            this.logger.info(
                `Syncing members from old OAuth provider for user ID: ${userId} after linking new OAuth account.`
            );
            const characters = await this.syncMembersToNewUserUseCase.execute(
                userId,
                oldOauthProvider.userId
            );
            return {
                ...newOauthProvider,
                characters,
            };
        }

        return {
            ...newOauthProvider,
            characters: [],
        };
    }
}
