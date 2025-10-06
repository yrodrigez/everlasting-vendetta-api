export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    accessTokenJti: string;
    refreshTokenJti: string;
}