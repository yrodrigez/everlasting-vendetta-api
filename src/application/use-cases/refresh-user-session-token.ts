import { RefreshTokenInput } from "@dto/auth/refresh-token-input";
import { RefreshTokenOutput } from "@dto/auth/refresh-token-output";
import { TokenPair } from "@dto/auth/token-pair";
import { IAuthRepository } from "@repositories/i-auth-repository";
import { IPermissionRepository } from "@repositories/i-permission-repository";
import { IRoleRepository } from "@repositories/i-role-repository";
import { ITokenService } from "src/domain/services/i-token-service";
import { OAuthProvider } from "src/domain/types/auth-types";

export class RefreshUserSessionTokenUseCase {
    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly tokenService: ITokenService,
        private readonly rolesRepository: IRoleRepository,
        private readonly permissionsRepository: IPermissionRepository,
    ) { }

    async execute({ ipAddress, refreshToken, userAgent }: RefreshTokenInput): Promise<RefreshTokenOutput> {
        const verifiedToken = this.tokenService.verifyRefreshToken(refreshToken);

        if (verifiedToken.type !== 'refresh' || !verifiedToken.jti || !verifiedToken.sub || !verifiedToken.family_id) {
            throw new Error("Invalid refresh token");
        }

        const currentToken = await this.authRepository.getRefreshToken(verifiedToken.jti);

        if (!currentToken) {
            throw new Error("Refresh token not found"); // TODO custom error
        }

        if (currentToken.revoked) {
            throw new Error("Refresh token revoked");// TODO custom error 
        }

        if (new Date(currentToken.expiresAt) < new Date()) {
            throw new Error("Refresh token expired"); // TODO custom error
        }

        if (currentToken.isRotated) {
            // TODO: notify user of possible breach and admins
            // Revoke all tokens in the family
            await this.authRepository.revokeFamilyTokens({
                familyId: verifiedToken.family_id,
                reason: 'breach_detected'
            });
            throw new Error("Refresh token revoked or not found"); // TODO custom error
        }

        const roles = await this.rolesRepository.findByMemberId(verifiedToken.sub);
        const permissions = await this.permissionsRepository.findByRoles(roles);

        const newTokenPair = this.tokenService.generateTokenPair({
            userId: verifiedToken.sub,
            provider: verifiedToken.provider as "bnet" | "discord",
            familyId: verifiedToken.family_id,
            roles,
            permissions
        });

        await this.authRepository.rotateToken({
            oldJti: verifiedToken.jti,
            newJti: newTokenPair.refreshTokenJti,
            userId: verifiedToken.sub,
            familyId: verifiedToken.family_id,
            provider: verifiedToken.provider as "bnet" | "discord",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),  // TODO: move to config
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined
        });

        const oauthProvider = await this.authRepository.getOauthProvider(verifiedToken.sub, verifiedToken.provider as OAuthProvider);

        return {
            ...newTokenPair,
            provider: verifiedToken.provider as OAuthProvider,
            shouldRefreshProviderToken: oauthProvider ? (new Date(oauthProvider.expiresAt) < new Date(Date.now() + 5 * 60 * 1000)) : false // if the token expires in the next 5 minutes, we should refresh it
        };
    }
}