import { AuthenticateUserWithBattleNetInput } from "@dto/auth/auth-user-with-battlenet-input";
import { AuthenticateUserWithBattleNetOutput } from "@dto/auth/auth-user-with-battlenet-output";
import { Member, MemberCharacter } from "@entities/member";
import { WoWCharacter } from "@entities/wow/wow-character";
import { AuthError } from "@errors/auth-error";
import { IAuthRepository } from "@repositories/i-auth-repository";
import { IMemberRepository } from "@repositories/i-member-repository";
import { IWowAccountService } from "@repositories/i-wow-account-service";
import { IWowCharacterService } from "@repositories/i-wow-character-service";
import { IBlizzardOAuthService } from "src/domain/services/i-blizzard-oauth-service";
import { ITokenService } from "src/domain/services/i-token-service";
import { IUserContextService } from "src/domain/services/i-user-context-service";
import { createLogger } from "src/infrastructure/logging";
import { IWowAccountRepository } from "@repositories/i-wow-account-repository";

export class AuthenticateWithBattleNetUseCase {
    private readonly logger = createLogger('AuthenticateWithBattleNetUseCase');
    constructor(
        private readonly blizzardOAuthService: IBlizzardOAuthService,
        private readonly authRepository: IAuthRepository,
        private readonly wowAccountService: IWowAccountService,
        private readonly charactersService: IWowCharacterService,
        private readonly memberRepository: IMemberRepository,
        private readonly tokenService: ITokenService,
        private readonly userContextService: IUserContextService,
        private readonly wowAccountRepository: IWowAccountRepository,
    ) { }

    async execute({
        bnetToken,
        expires_at,
        ipAddress,
        userAgent
    }: AuthenticateUserWithBattleNetInput): Promise<AuthenticateUserWithBattleNetOutput> {
        const PROVIDER = 'bnet_oauth';
        const isValid = await this.blizzardOAuthService.checkTokenValidity(bnetToken);
        if (!isValid) {
            throw new AuthError(
                "Invalid or expired Battle.net access token",
                "AUTH_ERROR",
                401
            );
        }

        const { battletag, id } = await this.blizzardOAuthService.getUserInfo(bnetToken);
        await this.wowAccountRepository.upsert({
            id,
            battletag
        });
        const providerUserId = id.toString();
        const providerUsername = battletag;
        const { userId } = await this.authRepository.findOrCreateUser({
            provider: PROVIDER,
            providerUserId,
            username: providerUsername
        });

        const wowAccount = await this.wowAccountService.getWoWAccount();
        const accountCharacters = wowAccount.wow_accounts.reduce((acc, val) => acc.concat(val.characters), [] as WoWCharacter[]);

        const result = await Promise.all(
            accountCharacters.map(async (char) => {
                try {
                    if (char.level < 10) {
                        return char;
                    }

                    const character = await this.charactersService.getCharacterWithAvatar(
                        char.realm.slug,
                        char.name,
                    );
                    this.logger.info(`Fetched character ${char.name} on realm ${char.realm.slug} with level ${character.level}`);

                    return character;
                } catch (e) {
                    this.logger.error(`Error fetching character ${char.name} with level on realm ${char.realm.slug}`, e);
                    return char;
                }
            }));
        const characters = result.filter(Boolean) as WoWCharacter[];
        this.logger.info(`User ${userId} has ${characters.length} characters from Battle.net account.`);

        await this.memberRepository.upsertMany(
            characters.map(char => Member.fromWowCharacter(char as MemberCharacter, userId, wowAccount.id, 'bnet_oauth'))
        );

        await this.authRepository.storeOauthToken({
            userId,
            provider: PROVIDER,
            providerUserId,
            providerUsername,
            accessToken: bnetToken,
            refreshToken: null, // Battle.net does not provide a refresh token in this flow
            expiresAt: expires_at ? new Date(expires_at * 1000) : new Date(Date.now() + 3600 * 1000) // Default to 1 hour if not provided
        });

        const userContext = await this.userContextService.getUserContext(userId, 'bnet_oauth');


        const familyId = await this.authRepository.createTokenFamily({
            userId,
            provider: PROVIDER,
            ipAddress
        });

        const tokenPair = this.tokenService.generateTokenPair({
            userId: userId,
            roles: userContext.roles,
            permissions: userContext.permissions,
            provider: PROVIDER,
            familyId,
            isAdmin: userContext.isAdmin,
            isTemporal: false,
            isBanned: userContext.isBanned,
            isGuildMember: userContext.isGuildMember
        });

        await this.authRepository.storeRefreshToken({
            userId,
            tokenJti: tokenPair.refreshTokenJti!,
            familyId,
            provider: PROVIDER,
            expiresAt: new Date(tokenPair.refreshTokenExpiry! * 1000),
            ipAddress,
            userAgent
        });

        this.logger.info(`User ${userId} authenticated successfully with Battle.net. Issued new token pair.`);
        return {
            refreshToken: tokenPair.refreshToken,
            accessToken: tokenPair.accessToken,
            refreshTokenExpiresAt: tokenPair.refreshTokenExpiry,
            accessTokenExpiresAt: tokenPair.accessTokenExpiry
        };
    }
}
