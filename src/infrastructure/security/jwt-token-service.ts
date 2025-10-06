import { sign, verify } from 'jsonwebtoken';
import { AccessTokenPayload } from '@dto/auth/access-token-payload';
import { RefreshTokenPayload } from '@dto/auth/refresh-token-payload';
import { ITokenService } from 'src/domain/services/i-token-service';
import { TokenPair } from '@dto/auth/token-pair';
import { GenerateTokenPairInput } from '@dto/auth/generate-token-pair-input';

export class JWTTokenService implements ITokenService {
    private accessSecret: string;
    private refreshSecret: string;
    private jwtKid: string;

    constructor(accessSecret: string, refreshSecret: string, jwtKid: string) {
        this.accessSecret = accessSecret;
        this.refreshSecret = refreshSecret;
        this.jwtKid = jwtKid;
    }

    generateTokenPair(input: GenerateTokenPairInput): TokenPair {
        const now = Math.floor(Date.now() / 1000);

        const accessTokenJti = crypto.randomUUID();
        const accessTokenPayload = {
            jti: accessTokenJti,
            sub: input.userId,
            iat: now,
            exp: now + (15 * 60),  // 15 minutes
            type: 'access',
            aal: "aal1",
            aud: 'authenticated',
            role: 'authenticated',

            // Rich user data
            custom_roles: input.roles,
            permissions: input.permissions,
            provider: input.provider
        };

        const accessToken = sign(
            accessTokenPayload,
            this.accessSecret,
            { algorithm: 'HS256', header: { kid: this.jwtKid, alg: 'HS256', typ: 'JWT' } },
        );

        const refreshTokenJti = crypto.randomUUID();
        const refreshTokenPayload = {
            jti: refreshTokenJti,
            sub: input.userId,
            iat: now,
            exp: now + (30 * 24 * 60 * 60),  // 30 days
            type: 'refresh',
            provider: input.provider,
            family_id: input.familyId  // Link to family
        };

        const refreshToken = sign(
            refreshTokenPayload,
            this.refreshSecret,
            { algorithm: 'HS256' }
        );

        return {
            accessToken,
            refreshToken,
            accessTokenExpiry: accessTokenPayload.exp,
            refreshTokenExpiry: refreshTokenPayload.exp,
            accessTokenJti,
            refreshTokenJti,
        };
    }

    verifyAccessToken(token: string): AccessTokenPayload {
        return verify(token, this.accessSecret) as AccessTokenPayload;
    }

    verifyRefreshToken(token: string): RefreshTokenPayload {
        return verify(token, this.refreshSecret) as RefreshTokenPayload;
    }
}