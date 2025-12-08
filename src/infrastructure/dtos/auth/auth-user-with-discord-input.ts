export interface AuthenticateUserWithDiscordInput {
    discordToken: string;
    expires_at?: number;
    ipAddress?: string;
    userAgent?: string;
}
