import { GenerateTokenPairInput } from "@dto/auth/generate-token-pair-input";
import { RefreshTokenInput } from "@dto/auth/refresh-token-input";
import { RefreshTokenOutput } from "@dto/auth/refresh-token-output";
import { IAuthRepository } from "@repositories/i-auth-repository";
import { IPermissionRepository } from "@repositories/i-permission-repository";
import { IBannedRepository } from "@repositories/i-banned-repository";
import { IRoleRepository } from "@repositories/i-role-repository";
import { ITokenService } from "src/domain/services/i-token-service";
import { OAuthProvider } from "src/domain/types/auth-types";

export class RefreshUserSessionTokenUseCase {
    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly tokenService: ITokenService,
        private readonly rolesRepository: IRoleRepository,
        private readonly permissionsRepository: IPermissionRepository,
        private readonly bansRepository: IBannedRepository,
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
            throw new Error("Refresh token revoked, reason: " + currentToken.revokedReason);// TODO custom error
        }

        if (new Date(currentToken.expiresAt) < new Date()) {
            throw new Error("Refresh token expired"); // TODO custom error
        }

        const roles = await this.rolesRepository.findByMemberId(verifiedToken.sub);
        const permissions = await this.permissionsRepository.findByRoles(roles);
        const oauthProvider = await this.authRepository.getOauthProvider(verifiedToken.sub, verifiedToken.provider as OAuthProvider);
        const shouldRefreshProviderToken = oauthProvider ? (new Date(oauthProvider.expiresAt) < new Date(Date.now() + 5 * 60 * 1000)) : false
        const isBanned = await this.bansRepository.isUserBanned(verifiedToken.sub);

        if (currentToken.isRotated) {
            // Revoke all tokens in the family
            const inGrace = currentToken.previousValidUntil && (new Date() <= new Date(currentToken.previousValidUntil));
            if (!inGrace) {
                await this.authRepository.revokeFamilyTokens({
                    familyId: verifiedToken.family_id,
                    reason: 'breach_detected'
                });
                throw new Error("Refresh token revoked and not in grace period: " + JSON.stringify({ validUntil: currentToken.previousValidUntil, now: new Date() })); // TODO custom error
            }

            let headToken = currentToken.rotatedTo
                ? await this.authRepository.findTokenByJti(currentToken.rotatedTo)
                : null;

            if (!headToken || headToken.revoked || headToken.expiresAt < new Date() || headToken.isRotated) {
                headToken = await this.authRepository.getActiveFamilyToken(
                    verifiedToken.family_id,
                    verifiedToken.provider as OAuthProvider
                );
            }

            if (!headToken) {
                throw new Error("Head token not found");
            }

            const resignedRefresh = this.tokenService.signRefreshFromJti({
                jti: headToken.jti,
                userId: headToken.userId,
                family_id: headToken.familyId,
                provider: headToken.provider,
                exp: Math.floor(headToken.expiresAt.getTime() / 1000)
            });

            const newAccessToken = this.tokenService.generateAccessToken({
                userId: verifiedToken.sub,
                roles,
                permissions,
                provider: verifiedToken.provider as "bnet" | "discord",
                isAdmin: roles.includes('ADMIN'),
                isTemporal: false,
                isBanned: isBanned,
                exp: Math.floor(headToken.expiresAt.getTime() / 1000)
            } as Partial<GenerateTokenPairInput>);

            return {
                accessToken: newAccessToken.token,
                accessTokenExpiry: newAccessToken.expiry,
                accessTokenJti: newAccessToken.jti,
                provider: verifiedToken.provider as OAuthProvider,
                shouldRefreshProviderToken: shouldRefreshProviderToken,
                refreshToken: resignedRefresh.token,
                refreshTokenExpiry: resignedRefresh.expiry,
                refreshTokenJti: headToken!.jti
            };
        }

        const newTokenPair = this.tokenService.generateTokenPair({
            userId: verifiedToken.sub,
            provider: verifiedToken.provider as "bnet" | "discord",
            familyId: verifiedToken.family_id,
            roles,
            permissions,
            isAdmin: roles.includes('ADMIN'),
            isTemporal: false,
            isBanned: isBanned
        });

        let rotationError: unknown;
        try {
            await this.authRepository.rotateToken({
                oldJti: verifiedToken.jti,
                newJti: newTokenPair.refreshTokenJti!,
                userId: verifiedToken.sub,
                familyId: verifiedToken.family_id,
                provider: verifiedToken.provider as "bnet" | "discord",
                expiresAt: new Date(newTokenPair.refreshTokenExpiry! * 1000),
                ipAddress: ipAddress || undefined,
                userAgent: userAgent || undefined
            });
        } catch (error) {
            rotationError = error;
        }

        const activeFamilyToken = await this.authRepository.getActiveFamilyToken(
            verifiedToken.family_id,
            verifiedToken.provider as OAuthProvider
        );

        if (!activeFamilyToken) {
            if (rotationError) {
                throw rotationError;
            }

            throw new Error("Active refresh token not found after rotation");
        }

        let refreshTokenPayload = {
            refreshToken: newTokenPair.refreshToken,
            refreshTokenExpiry: newTokenPair.refreshTokenExpiry,
            refreshTokenJti: newTokenPair.refreshTokenJti
        };

        if (activeFamilyToken.jti !== newTokenPair.refreshTokenJti) {
            const resignedRefresh = this.tokenService.signRefreshFromJti({
                jti: activeFamilyToken.jti,
                userId: activeFamilyToken.userId,
                family_id: activeFamilyToken.familyId,
                provider: activeFamilyToken.provider,
                exp: Math.floor(activeFamilyToken.expiresAt.getTime() / 1000)
            });

            refreshTokenPayload = {
                refreshToken: resignedRefresh.token,
                refreshTokenExpiry: resignedRefresh.expiry,
                refreshTokenJti: resignedRefresh.jti
            };
        }

        return {
            accessToken: newTokenPair.accessToken,
            accessTokenExpiry: newTokenPair.accessTokenExpiry,
            accessTokenJti: newTokenPair.accessTokenJti,
            refreshToken: refreshTokenPayload.refreshToken,
            refreshTokenExpiry: refreshTokenPayload.refreshTokenExpiry,
            refreshTokenJti: refreshTokenPayload.refreshTokenJti,
            provider: verifiedToken.provider as OAuthProvider,
            shouldRefreshProviderToken: shouldRefreshProviderToken
        };
    }
}
