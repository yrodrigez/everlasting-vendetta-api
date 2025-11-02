export interface AuthenticateUserWithBattleNetOutput {
  refreshToken: string;
  accessToken: string;
  refreshTokenExpiresAt: number;
  accessTokenExpiresAt: number;
}