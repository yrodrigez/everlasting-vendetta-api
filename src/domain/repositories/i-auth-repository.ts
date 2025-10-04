export interface IAuthRepository {
    findOrCreateUser(
        provider: string,
        providerUserId: string,
        username: string,
    ): Promise<{ userId: string; isNewUser: boolean; }>;
    storeOauthToken(
        userId: string,
        provider: 'bnet' | 'discord',
        providerUserId: string,
        providerUsername: string,
        accessToken: string,
        refreshToken: string | null,
        expiresAt: Date
    ): Promise<void>;

    storeRefreshToken(
        userId: string,
        tokenJti: string,      // Extracted from JWT
        familyId: string,
        provider: 'bnet' | 'discord',
        expiresAt: Date,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void>;

    getRefreshToken(tokenJti: string): Promise<{
        user_id: string;
        token_jti: string;
        family_id: string;
        provider: 'bnet' | 'discord';
        expires_at: string; // ISO date string
        revoked: boolean;
        created_at: string; // ISO date string
        ip_address: string | null;
        user_agent: string | null;
    } | null>;

    markTokenAsRotated(oldTokenJti: string, newTokenJti: string): Promise<void>;
    revokeRefreshToken(tokenJti: string, reason: 'manual' | 'breach_detected' | 'logout_all'): Promise<void>;
    revokeFamilyTokens(familyId: string, reason: 'manual' | 'breach_detected' | 'logout_all'): Promise<void>;

    createTokenFamily(userId: string, provider: 'bnet' | 'discord', ipAddress?: string): Promise<string>;
}