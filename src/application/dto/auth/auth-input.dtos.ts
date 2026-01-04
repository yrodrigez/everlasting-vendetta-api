import { TokenRevocationReason } from "src/domain/types/auth-types";
import { Provider } from "./provider";

/**
 * Input DTOs for Auth operations
 * These DTOs are used for incoming data to the application layer
 */

export interface StoreRefreshTokenDTO {
    userId: string;
    tokenJti: string;
    familyId: string;
    provider: Provider;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
}

export interface RotateTokenDTO {
    oldJti: string;
    newJti: string;
    userId: string;
    familyId: string;
    provider: Provider;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
}

export interface CreateTokenFamilyDTO {
    userId: string;
    provider: Provider;
    ipAddress?: string;
}

export interface RevokeRefreshTokenDTO {
    tokenJti: string;
    reason: TokenRevocationReason;
}

export interface RevokeFamilyTokensDTO {
    familyId: string;
    reason: TokenRevocationReason;
}

export interface StoreOauthTokenDTO {
    userId: string;
    provider: Provider;
    providerUserId: string;
    providerUsername: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
}

export interface FindOrCreateUserDTO {
    provider: string;
    providerUserId: string;
    username: string;
}

export interface MarkTokenAsRotatedDTO {
    oldTokenJti: string;
    newTokenJti: string;
}
