export interface AuthenticateUserWithDiscordInput {
    discordToken: string;
    expires_at: number; // OAuth token expiry timestamp in seconds
    ipAddress?: string;
    userAgent?: string;
}
