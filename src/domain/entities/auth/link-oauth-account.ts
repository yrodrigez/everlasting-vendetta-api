import { Provider } from "@dto/auth/provider";

interface LinkOAuthAccountProps {
    userId: string;
    provider: Provider;
    providerUserId: string;
    providerEmail: string;
    providerUsername: string;
    accessToken: string;
    refreshToken?: string;  
    expiresAt?: Date;
    metadata?: Record<string, any>;
}

export class LinkOAuthAccount implements LinkOAuthAccountProps {
    readonly userId: string;
    readonly provider: Provider;
    readonly providerUserId: string
    readonly providerEmail: string;
    readonly providerUsername: string;
    readonly accessToken: string;
    readonly refreshToken?: string;
    readonly expiresAt?: Date;
    readonly metadata?: Record<string, any>;

    constructor({
        userId,
        provider,
        providerUserId,
        providerEmail,
        providerUsername,
        accessToken,
        refreshToken,
        expiresAt,
        metadata
     }: LinkOAuthAccountProps) {
        this.userId = userId;
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.providerEmail = providerEmail;
        this.providerUsername = providerUsername;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresAt = expiresAt;
        this.metadata = metadata;
    }
}