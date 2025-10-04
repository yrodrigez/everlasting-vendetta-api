import { AccessTokenPayload } from "@dto/access-token-payload";
import { GenerateTokenPairInput } from "@dto/generate-token-pair-input";
import { RefreshTokenPayload } from "@dto/refresh-token-payload";
import { TokenPair } from "@dto/token-pair";

export interface ITokenService {

    generateTokenPair(input: GenerateTokenPairInput): TokenPair;

    verifyAccessToken(token: string): AccessTokenPayload;

    verifyRefreshToken(token: string): RefreshTokenPayload;

}