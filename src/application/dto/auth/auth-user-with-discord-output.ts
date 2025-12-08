export interface AuthenticateUserWithDiscordOutput {
    refreshToken: string;
    accessToken: string;
    refreshTokenExpiresAt: number;
    accessTokenExpiresAt: number;
}
