import { AuthenticateUserWithDiscordInput } from "@dto/auth/auth-user-with-discord-input";
import { AuthenticateUserWithDiscordOutput } from "@dto/auth/auth-user-with-discord-output";
import { AuthError } from "@errors/auth-error";
import { IAuthRepository } from "@repositories/i-auth-repository";
import { IBannedRepository } from "@repositories/i-banned-repository";
import { IPermissionRepository } from "@repositories/i-permission-repository";
import { IRoleRepository } from "@repositories/i-role-repository";
import { ITokenService } from "src/domain/services/i-token-service";
import { createLogger } from "src/infrastructure/logging";

export class AuthenticateWithDiscordUseCase {
    private readonly logger = createLogger('AuthenticateWithDiscordUseCase');

    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly roleRepository: IRoleRepository,
        private readonly permissionsRepository: IPermissionRepository,
        private readonly tokenService: ITokenService,
        private readonly bansRepository: IBannedRepository,
    ) { }

    async execute({
        discordToken,
        expires_at,
        ipAddress,
        userAgent
    }: AuthenticateUserWithDiscordInput): Promise<AuthenticateUserWithDiscordOutput> {
        try {
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
                provider: 'discord',
                providerUserId,
                username: providerUsername
            });

            // Store Discord token
            await this.authRepository.storeOauthToken({
                userId,
                provider: 'discord',
                providerUserId,
                providerUsername,
                accessToken: discordToken,
                refreshToken: null,
                expiresAt: expires_at ? new Date(expires_at * 1000) : new Date(Date.now() + 3600 * 1000)
            });

            // Get user roles and permissions
            const roles = await this.roleRepository.findByMemberId(userId);
            const permissions = await this.permissionsRepository.findByRoles(roles);
            const isBanned = await this.bansRepository.isUserBanned(userId);

            // Create token family for session management
            const familyId = await this.authRepository.createTokenFamily({
                userId,
                provider: 'discord',
                ipAddress
            });

            // Generate token pair
            const tokenPair = this.tokenService.generateTokenPair({
                userId: userId,
                roles,
                permissions,
                provider: 'discord',
                familyId,
                isAdmin: roles.includes('ADMIN'),
                isTemporal: false,
                isBanned: isBanned
            });

            // Store refresh token
            await this.authRepository.storeRefreshToken({
                userId,
                tokenJti: tokenPair.refreshTokenJti!,
                familyId,
                provider: 'discord',
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
