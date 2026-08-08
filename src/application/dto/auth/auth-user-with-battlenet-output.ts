export interface AuthenticateUserWithBattleNetOutput {
    userId: string;
    refreshToken: string;
    accessToken: string;
    refreshTokenExpiresAt: number;
    accessTokenExpiresAt: number;
}
