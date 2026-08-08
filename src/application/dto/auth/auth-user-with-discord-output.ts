export interface AuthenticateUserWithDiscordOutput {
    userId: string;
    refreshToken: string;
    accessToken: string;
    refreshTokenExpiresAt: number;
    accessTokenExpiresAt: number;
}
