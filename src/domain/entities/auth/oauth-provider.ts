import { Provider } from "@dto/auth/provider";

interface IOauthProvider {
    id: string;
    userId: string;
    provider: Provider;
    providerUserId: string;
    providerUsername: string;
    providerEmail?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    lastSyncAt?: Date;
    metadata?: Record<string, any>;
}

export class OAuthProvider implements IOauthProvider {
    readonly id: string;
    readonly userId: string;
    readonly provider: Provider;
    readonly providerUserId: string;
    readonly providerUsername: string;
    readonly providerEmail?: string;
    readonly accessToken?: string;
    readonly refreshToken?: string;
    readonly tokenExpiresAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly lastSyncAt?: Date;
    readonly metadata?: Record<string, any>;

    constructor({
        id,
        userId,
        provider,
        providerUserId,
        providerUsername,
        providerEmail,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        createdAt,
        updatedAt,
        lastSyncAt,
        metadata
    }: IOauthProvider) {
        this.id = id;
        this.userId = userId;
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.providerUsername = providerUsername;
        this.providerEmail = providerEmail;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiresAt = tokenExpiresAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.lastSyncAt = lastSyncAt;
        this.metadata = metadata;
    }

    static fromDataBase(data: any): OAuthProvider {
        return new OAuthProvider({
            id: data.id,
            userId: data.user_id,
            provider: data.provider,
            providerUserId: data.provider_user_id,
            providerUsername: data.provider_username,
            providerEmail: data.provider_email,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            tokenExpiresAt: data.token_expires_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            lastSyncAt: data.last_sync_at,
            metadata: data.metadata
        });
    }

    public toDatabase(): any {
        return {
            id: this.id,
            user_id: this.userId,
            provider: this.provider,
            provider_user_id: this.providerUserId,
            provider_username: this.providerUsername,
            provider_email: this.providerEmail,
            access_token: this.accessToken,
            refresh_token: this.refreshToken,
            token_expires_at: this.tokenExpiresAt,
            created_at: this.createdAt,
            updated_at: this.updatedAt,
            last_sync_at: this.lastSyncAt,
            metadata: this.metadata
        };
    }


}
