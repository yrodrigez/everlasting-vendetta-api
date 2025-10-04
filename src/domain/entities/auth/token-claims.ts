import { JWTPayload } from "jose";
import { WoWCharacter } from "../wow/wow-character.ts";

export type WowWAccountClaims = WoWCharacter & {
    userId: string;
    source: string;
    isTemporal: boolean;
    isAdmin: boolean;
};

export class TokenClaims implements JWTPayload {
    readonly iss?: string | undefined;
    readonly sub?: string | undefined;
    readonly aud?: string | string[] | undefined;
    readonly jti?: string | undefined;
    readonly nbf?: number | undefined;
    readonly exp?: number | undefined;
    readonly iat?: number | undefined;
    readonly [propName: string]: unknown;
    constructor(
        {
            iss,
            sub,
            aud,
            jti,
            nbf,
            exp,
            iat,
            ...customClaims
        }: {
            iss?: string;
            sub?: string;
            aud?: string | string[];
            jti?: string;
            nbf?: number;
            exp?: number;
            iat?: number;
            [propName: string]: unknown;
        }
    ) {
        this.iss = iss;
        this.sub = sub;
        this.aud = aud;
        this.jti = jti;
        this.nbf = nbf;
        this.exp = exp;
        this.iat = iat;
        Object.assign(this, customClaims);
    }

    static fromObject(obj: { [key: string]: unknown }): TokenClaims {
        return new TokenClaims(obj as TokenClaims);
    }

    toJson(): { [key: string]: unknown } {
        return { ...this };
    }
}
