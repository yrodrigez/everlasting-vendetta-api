import { OAuthProvider, TokenRevocationReason } from "src/domain/types/auth-types";

export class RefreshToken {
    readonly id: string;
    readonly userId: string;
    readonly jti: string;
    readonly familyId: string;
    readonly provider: OAuthProvider;
    readonly expiresAt: Date;
    readonly createdAt: Date;
    readonly lastUsedAt: Date | null;
    readonly revoked: boolean;
    readonly revokedAt: Date | null;
    readonly revokedReason: TokenRevocationReason | null;
    readonly ipAddress: string | null;
    readonly userAgent: string | null;
    readonly deviceFingerprint: string | null;
    readonly isRotated: boolean;
    readonly rotatedTo: string | null;
    constructor({
        id = crypto.randomUUID(),
        userId,
        jti,
        familyId,
        provider,
        expiresAt,
        createdAt = new Date(),
        lastUsedAt = null,
        revoked = false,
        revokedAt = null,
        revokedReason = null,
        ipAddress = null,
        userAgent = null,
        deviceFingerprint = null,
        isRotated = false,
        rotatedTo = null
    }: {
        id?: string;
        userId: string;
        jti: string;
        familyId: string;
        provider: OAuthProvider;
        expiresAt: Date;
        createdAt?: Date;
        lastUsedAt?: Date | null;
        revoked?: boolean;
        revokedAt?: Date | null;
        revokedReason?: TokenRevocationReason | null;
        ipAddress?: string | null;
        userAgent?: string | null;
        deviceFingerprint?: string | null;
        isRotated?: boolean;
        rotatedTo?: string | null;
    }) {
        this.id = id;
        this.userId = userId;
        this.jti = jti;
        this.familyId = familyId;
        this.provider = provider;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
        this.lastUsedAt = lastUsedAt;
        this.revoked = revoked;
        this.revokedAt = revokedAt;
        this.revokedReason = revokedReason;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.deviceFingerprint = deviceFingerprint;
        this.isRotated = isRotated;
        this.rotatedTo = rotatedTo;
    }

    static fromDatabase(row: {
        id: string;
        user_id: string;
        token_jti: string;
        family_id: string;
        provider: OAuthProvider;
        expires_at: string; // ISO date string
        created_at: string; // ISO date string
        last_used_at: string | null; // ISO date string or null
        revoked: boolean;
        revoked_at: string | null; // ISO date string or null
        revoked_reason: TokenRevocationReason | null;
        ip_address: string | null;
        user_agent: string | null;
        device_fingerprint: string | null;
        is_rotated: boolean;
        rotated_to_jti: string | null;
    }): RefreshToken {
        return new RefreshToken({
            id: row.id,
            userId: row.user_id,
            jti: row.token_jti,
            familyId: row.family_id,
            provider: row.provider,
            expiresAt: new Date(row.expires_at),
            createdAt: new Date(row.created_at),
            lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
            revoked: row.revoked_reason ? true : row.revoked_at ? true : row.revoked,
            revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
            revokedReason: row.revoked_reason,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            deviceFingerprint: row.device_fingerprint,
            isRotated: row.is_rotated,
            rotatedTo: row.rotated_to_jti,
        });
    }

}