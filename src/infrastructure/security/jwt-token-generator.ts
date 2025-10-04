import { SignJWT } from "jose";
import { TokenClaims } from "@entities/auth/token-claims";
import { IJwtTokenGenerator } from "../../domain/repositories/i-jwt-token-generation";
import { getEnvironment } from "../environment";
import { createLogger } from "../logging/index";
import { RefreshTokenPayload } from "@dto/refresh-token-payload";
import { AccessTokenPayload } from "@dto/access-token-payload";

export class JwtTokenGenerator implements IJwtTokenGenerator {
    private logger = createLogger("JwtTokenGenerator");

    async generate(claims: TokenClaims): Promise<string> {
        this.logger.debug("Generating JWT token with claims", claims);
        const { jwtSecret, jwtExpiration, jwtKid } = getEnvironment();

        const secret = new TextEncoder().encode(jwtSecret);

        this.logger.debug("Creating JWT token");

        const jwt = await new SignJWT(claims)
            .setProtectedHeader({ alg: "HS256", typ: "JWT", kid: jwtKid })
            .setExpirationTime(Math.floor(Date.now() / 1000) + jwtExpiration)
            .sign(secret);

        this.logger.debug("JWT token generated successfully");
        return jwt;
    }


}
