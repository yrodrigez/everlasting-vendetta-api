import { AccessTokenPayload } from "@dto/auth/access-token-payload";
import { GenerateTokenPairInput } from "@dto/auth/generate-token-pair-input";
import { RefreshTokenPayload } from "@dto/auth/refresh-token-payload";
import { TokenPair } from "@dto/auth/token-pair";

export interface ITokenService {

    generateTokenPair(input: GenerateTokenPairInput): TokenPair;

    verifyAccessToken(token: string): AccessTokenPayload;

    verifyRefreshToken(token: string): RefreshTokenPayload;

    verifyAnonToken(token: string): AccessTokenPayload;

    generateAccessToken(payload: Partial<AccessTokenPayload>): { token: string; expiry: number; jti: string };

    generateRefreshToken(payload: Partial<RefreshTokenPayload>): { token: string; expiry: number; jti: string };

    signRefreshFromJti({
        jti,
        userId,
        family_id,
        provider,
        exp,
    }: {
        jti: string;
        userId: string;
        family_id: string;
        provider: 'bnet' | 'discord';
        exp: number;
    }): { token: string; expiry: number; jti: string };

    decodeToken(token: string): AccessTokenPayload | RefreshTokenPayload;
}