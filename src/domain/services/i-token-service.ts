import { AccessTokenPayload } from "@dto/auth/access-token-payload";
import { GenerateTokenPairInput } from "@dto/auth/generate-token-pair-input";
import { RefreshTokenPayload } from "@dto/auth/refresh-token-payload";
import { TokenPair } from "@dto/auth/token-pair";

export interface ITokenService {

    generateTokenPair(input: GenerateTokenPairInput): TokenPair;

    verifyAccessToken(token: string): AccessTokenPayload;

    verifyRefreshToken(token: string): RefreshTokenPayload;

}