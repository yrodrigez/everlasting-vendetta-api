import { Provider } from "@dto/auth/provider";

export interface UserContext {
    userId: string;
    roles: string[];
    permissions: string[];
    isBanned: boolean;
    isAdmin: boolean;
    oauthProvider?: {
        provider: Provider;
        expiresAt: Date;
        accessToken: string;
        refreshToken: string | null;
    } | null;
    shouldRefreshProviderToken: boolean;
    isGuildMember: boolean;
}

export interface IUserContextService {
    /**
     * Gets the complete user context including roles, permissions, ban status, and OAuth provider info
     * @param userId - The user ID
     * @param provider - Optional OAuth provider to check token expiration
     * @returns Complete user context
     */
    getUserContext(userId: string, provider?: Provider): Promise<UserContext>;
}
