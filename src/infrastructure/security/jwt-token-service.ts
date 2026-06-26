import jwt from "jsonwebtoken";
import { AccessTokenPayload } from "@dto/auth/access-token-payload";
import { RefreshTokenPayload } from "@dto/auth/refresh-token-payload";
import { ITokenService } from "src/domain/services/i-token-service";
import { TokenPair } from "@dto/auth/token-pair";
import { GenerateTokenPairInput } from "@dto/auth/generate-token-pair-input";
import { getEnvironment } from "../environment";
import { Provider } from "@dto/auth/provider";

const { sign, verify, decode } = jwt;
export class JWTTokenService implements ITokenService {
    private accessSecret: string | Buffer;
    private refreshSecret: string | Buffer;
    private readonly anonKey: string | Buffer;
    private jwtKid: string;

    constructor(
        accessSecret: string | Buffer,
        refreshSecret: string | Buffer,
        jwtKid: string
    ) {
        this.accessSecret = accessSecret;
        this.refreshSecret = refreshSecret;
        this.jwtKid = jwtKid;
        const config = getEnvironment();
        this.anonKey = config.jwtAnonKey;
    }

    decodeToken(token: string): AccessTokenPayload | RefreshTokenPayload {
        return decode(token) as AccessTokenPayload | RefreshTokenPayload;
    }

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
        provider: Provider;
        exp: number;
    }): { token: string; expiry: number; jti: string } {
        const now = Math.floor(Date.now() / 1000);
        const refreshTokenPayload: RefreshTokenPayload = {
            jti,
            sub: userId,
            iat: now,
            exp: exp || now + 30 * 24 * 60 * 60, // 30 days
            type: "refresh",
            provider,
            family_id, // Link to family
        };
        const refreshToken = sign(refreshTokenPayload, this.refreshSecret, {
            algorithm: "HS256",
        });
        return {
            token: refreshToken,
            expiry: refreshTokenPayload.exp,
            jti: refreshTokenPayload.jti,
        };
    }

    generateAccessToken(input: Partial<GenerateTokenPairInput>): {
        token: string;
        expiry: number;
        jti: string;
    } {
        const now = Math.floor(Date.now() / 1000);

        if (
            !input.userId ||
            !input.roles ||
            !input.permissions ||
            !input.provider
        ) {
            throw new Error("Missing required fields to generate access token");
        }

        const accessTokenJti = crypto.randomUUID();
        const accessTokenPayload: AccessTokenPayload = {
            iss: "https://ijzwizzfjawlixolcuia.supabase.co/auth/v1",
            jti: accessTokenJti,
            sub: input.userId,
            iat: now,
            exp: now + 15 * 60, // 15 minutes
            type: "access",
            aal: "aal1",
            aud: "authenticated",
            role: "authenticated",

            // Rich user data
            isBanned: input.isBanned || false,
            custom_roles: input.roles,
            permissions: input.permissions,
            provider: input.provider,
            isTemporal: input.isTemporal || false,
            isAdmin: input.isAdmin || false,
            isGuildMember: input.isGuildMember || false,
            email: "",
        };

        const accessToken = sign(accessTokenPayload, this.accessSecret, {
            algorithm: "HS256",
            header: { kid: this.jwtKid, alg: "HS256", typ: "JWT" },
        });

        return {
            token: accessToken,
            expiry: accessTokenPayload.exp,
            jti: accessTokenJti,
        };
    }

    generateRefreshToken(input: Partial<GenerateTokenPairInput>): {
        token: string;
        expiry: number;
        jti: string;
    } {
        const now = Math.floor(Date.now() / 1000);

        if (!input.userId || !input.provider || !input.familyId) {
            throw new Error(
                "Missing required fields to generate refresh token"
            );
        }

        const refreshTokenJti = crypto.randomUUID();
        const refreshTokenPayload: RefreshTokenPayload = {
            jti: refreshTokenJti,
            sub: input.userId,
            iat: now,
            exp: now + 30 * 24 * 60 * 60, // 30 days
            type: "refresh",
            provider: input.provider,
            family_id: input.familyId, // Link to family
        };

        const refreshToken = sign(refreshTokenPayload, this.refreshSecret, {
            algorithm: "HS256",
        });

        return {
            token: refreshToken,
            expiry: refreshTokenPayload.exp,
            jti: refreshTokenJti,
        };
    }

    generateTokenPair(input: GenerateTokenPairInput): TokenPair {
        const {
            token: accessToken,
            expiry: accessTokenExpiry,
            jti: accessTokenJti,
        } = this.generateAccessToken(input);
        const {
            token: refreshToken,
            expiry: refreshTokenExpiry,
            jti: refreshTokenJti,
        } = this.generateRefreshToken(input);
        return {
            accessToken,
            refreshToken,
            accessTokenExpiry,
            refreshTokenExpiry,
            accessTokenJti,
            refreshTokenJti,
        };
    }

    verifyAccessToken(token: string): AccessTokenPayload {
        return verify(token, this.accessSecret, {
            algorithms: ["HS256"],
        }) as AccessTokenPayload;
    }

    verifyRefreshToken(token: string): RefreshTokenPayload {
        return verify(token, this.refreshSecret, {
            algorithms: ["HS256"],
        }) as RefreshTokenPayload;
    }

    verifyAnonToken(token: string): AccessTokenPayload {
        return verify(token, this.anonKey, {
            algorithms: ["HS256"],
        }) as AccessTokenPayload;
    }
}
