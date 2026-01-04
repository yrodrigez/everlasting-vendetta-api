import { AuthenticateUserWithDiscordInput } from "@dto/auth/auth-user-with-discord-input";
import { AuthenticateUserWithDiscordOutput } from "@dto/auth/auth-user-with-discord-output";
import { AuthError } from "@errors/auth-error";
import { IAuthRepository } from "@repositories/i-auth-repository";
import { ITokenService } from "src/domain/services/i-token-service";
import { IUserContextService } from "src/domain/services/i-user-context-service";
import { createLogger } from "src/infrastructure/logging";

export class AuthenticateWithDiscordUseCase {
    private readonly logger = createLogger('AuthenticateWithDiscordUseCase');

    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly tokenService: ITokenService,
        private readonly userContextService: IUserContextService,
    ) { }

    async execute({
        discordToken,
        expires_at,
        ipAddress,
        userAgent,
        refreshToken, // TODO: implement refresh token logic
    }: AuthenticateUserWithDiscordInput): Promise<AuthenticateUserWithDiscordOutput> {
        try {
            const PROVIDER = 'discord_oauth';
            // Validate token by fetching Discord user info
            const userInfo = await this.getDiscordUserInfo(discordToken);
            if (!userInfo) {
                throw new AuthError(
                    "Invalid or expired Discord access token",
                    "AUTH_ERROR",
                    401
                );
            }

            const providerUserId = userInfo.id;
            const providerUsername = userInfo.username;

            // Find or create user
            const { userId } = await this.authRepository.findOrCreateUser({
                provider: PROVIDER,
                providerUserId,
                username: providerUsername
            });

            // Store Discord token
            await this.authRepository.storeOauthToken({
                userId,
                provider: PROVIDER,
                providerUserId,
                providerUsername,
                accessToken: discordToken,
                refreshToken: null,
                expiresAt: expires_at ? new Date(expires_at * 1000) : new Date(Date.now() + 3600 * 1000)
            });

            // Get complete user context using the domain service
            const userContext = await this.userContextService.getUserContext(userId, 'discord' as any);

            // Create token family for session management
            const familyId = await this.authRepository.createTokenFamily({
                userId,
                provider: PROVIDER,
                ipAddress
            });

            // Generate token pair
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

            // Store refresh token
            await this.authRepository.storeRefreshToken({
                userId,
                tokenJti: tokenPair.refreshTokenJti!,
                familyId,
                provider: PROVIDER,
                expiresAt: new Date(tokenPair.refreshTokenExpiry! * 1000),
                ipAddress,
                userAgent
            });

            this.logger.info(`User ${userId} authenticated successfully with Discord. Issued new token pair.`);

            return {
                refreshToken: tokenPair.refreshToken,
                accessToken: tokenPair.accessToken,
                refreshTokenExpiresAt: tokenPair.refreshTokenExpiry,
                accessTokenExpiresAt: tokenPair.accessTokenExpiry
            };
        } catch (error) {
            this.logger.error('Discord authentication failed', error);
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(
                'Discord authentication failed',
                'AUTH_ERROR',
                500
            );
        }
    }

    private async getDiscordUserInfo(token: string): Promise<{ id: string; username: string } | null> {
        try {
            const response = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                this.logger.error(`Discord API error: ${response.status}`);
                return null;
            }

            const data = await response.json() as { id: string; username: string };
            return {
                id: data.id,
                username: data.username
            };
        } catch (error) {
            this.logger.error('Failed to fetch Discord user info', error);
            return null;
        }
    }
}
