import { GenerateTokenPairInput } from "@dto/auth/generate-token-pair-input";
import { RefreshTokenInput } from "@dto/auth/refresh-token-input";
import { RefreshTokenOutput } from "@dto/auth/refresh-token-output";
import { IAuthRepository } from "@repositories/i-auth-repository";
import { ITokenService } from "src/domain/services/i-token-service";
import { IUserContextService } from "src/domain/services/i-user-context-service";
import { OAuthProvider } from "src/domain/types/auth-types";
import { Provider } from "@dto/auth/provider";
import { IEventTrackingService } from "src/domain/services/i-event-tracking-service";

export class RefreshUserSessionTokenUseCase {
    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly tokenService: ITokenService,
        private readonly userContextService: IUserContextService,
        private readonly eventTracker: IEventTrackingService,
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

        // Get complete user context using the domain service
        const userContext = await this.userContextService.getUserContext(
            verifiedToken.sub,
            verifiedToken.provider as Provider
        );

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
                    verifiedToken.provider as Provider
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
                roles: userContext.roles,
                permissions: userContext.permissions,
                provider: verifiedToken.provider,
                isAdmin: userContext.isAdmin,
                isTemporal: false,
                isBanned: userContext.isBanned,
                exp: Math.floor(headToken.expiresAt.getTime() / 1000),
                isGuildMember: userContext.isGuildMember
            } as Partial<GenerateTokenPairInput>);

            await this.eventTracker.track({
                event_name: 'token_refresh',
                event_type: 'auth',
                user_id: verifiedToken.sub,
                metadata: { provider: verifiedToken.provider, was_rotated: true },
                ip_address: ipAddress || undefined,
                user_agent: userAgent || undefined,
            });

            return {
                accessToken: newAccessToken.token,
                accessTokenExpiry: newAccessToken.expiry,
                accessTokenJti: newAccessToken.jti,
                provider: verifiedToken.provider as OAuthProvider,
                shouldRefreshProviderToken: userContext.shouldRefreshProviderToken,
                refreshToken: resignedRefresh.token,
                refreshTokenExpiry: resignedRefresh.expiry,
                refreshTokenJti: headToken!.jti
            };
        }

        const newTokenPair = this.tokenService.generateTokenPair({
            userId: verifiedToken.sub,
            provider: verifiedToken.provider,
            familyId: verifiedToken.family_id,
            roles: userContext.roles,
            permissions: userContext.permissions,
            isAdmin: userContext.isAdmin,
            isTemporal: false,
            isBanned: userContext.isBanned,
            isGuildMember: userContext.isGuildMember
        });

        let rotationError: unknown;
        try {
            await this.authRepository.rotateToken({
                oldJti: verifiedToken.jti,
                newJti: newTokenPair.refreshTokenJti!,
                userId: verifiedToken.sub,
                familyId: verifiedToken.family_id,
                provider: verifiedToken.provider,
                expiresAt: new Date(newTokenPair.refreshTokenExpiry! * 1000),
                ipAddress: ipAddress || undefined,
                userAgent: userAgent || undefined
            });
        } catch (error) {
            rotationError = error;
        }

        const activeFamilyToken = await this.authRepository.getActiveFamilyToken(
            verifiedToken.family_id,
            verifiedToken.provider as Provider
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

        await this.eventTracker.track({
            event_name: 'token_refresh',
            event_type: 'auth',
            user_id: verifiedToken.sub,
            metadata: { provider: verifiedToken.provider, was_rotated: false },
            ip_address: ipAddress || undefined,
            user_agent: userAgent || undefined,
        });

        return {
            accessToken: newTokenPair.accessToken,
            accessTokenExpiry: newTokenPair.accessTokenExpiry,
            accessTokenJti: newTokenPair.accessTokenJti,
            refreshToken: refreshTokenPayload.refreshToken,
            refreshTokenExpiry: refreshTokenPayload.refreshTokenExpiry,
            refreshTokenJti: refreshTokenPayload.refreshTokenJti,
            provider: verifiedToken.provider as OAuthProvider,
            shouldRefreshProviderToken: userContext.shouldRefreshProviderToken
        };
    }
}
