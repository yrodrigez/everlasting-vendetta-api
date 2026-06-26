import { Provider } from "./provider";

export type SessionInput = {
    access_token: string;
    provider: Provider;
    expires_at: number; // OAuth token expiry timestamp in seconds
    refresh_token?: string;
    ipAddress?: string;
    userAgent?: string;
};

export type SessionOutput = {
    sessionId: string;
} & StoredSession;

export type StoredSession = {
    refreshToken: string;
    accessToken: string;
    refreshTokenExpiresAt: number;
    accessTokenExpiresAt: number;
    provider: Provider;
};
