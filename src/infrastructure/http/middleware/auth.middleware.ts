import { Context, Next } from "hono";
import { JWTTokenService } from "../../security/jwt-token-service";
import { AccessTokenPayload } from "@dto/auth/access-token-payload";
import { createLogger, Logger } from "src/infrastructure/logging";
import { ResponseMapper } from "@utils/map-error";
import { Provider } from "@dto/auth/provider";
import { authContainer } from "@infrastructure/di/auth/auth.container";

export interface AuthenticatedContext extends Context {
    user?: AccessTokenPayload;
}

function verifyAuthenticationMiddleware(
    token: string,
    jwtService: JWTTokenService,
    logger: Logger
): AccessTokenPayload | null {
    try {
        return jwtService.verifyAccessToken(token);
    } catch (error) {
        logger.error("Failed to verify access token", undefined, {
            error: (error as Error)?.message ?? (error as any)?.error ?? "",
        });
        return null;
    }
}

function verifyAnonTokenMiddleware(
    token: string,
    jwtService: JWTTokenService,
    logger: Logger
): AccessTokenPayload | null {
    try {
        return jwtService.verifyAnonToken(token);
    } catch (error) {
        logger.error("Failed to verify anon token", undefined, {
            error: (error as Error)?.message ?? (error as any)?.error ?? "",
        });
        return null;
    }
}

export type UserPayload = {
    userId: string;
    roles: string[];
    permissions: string[];
    provider: Provider;
    isTemporal: boolean;
    isAdmin: boolean;
    isBanned: boolean;
    isGuildMember: boolean;
};

function mapUser(payload: AccessTokenPayload): UserPayload {
    return {
        userId: payload.sub,
        roles: payload.custom_roles,
        permissions: payload.permissions,
        provider: payload.provider,
        isTemporal: payload.isTemporal || false,
        isAdmin:
            payload.custom_roles?.includes("admin") || payload.isAdmin || false,
        isBanned: payload.isBanned || false,
        isGuildMember: payload.isGuildMember || false,
    };
}

/**
 * Middleware to authenticate requests using JWT access tokens
 * Extracts and verifies the Bearer token from the Authorization header
 */
export async function authMiddleware(context: Context, next: Next) {
    const logger = createLogger("AuthMiddleware");
    const authHeader = context.req.header("Authorization");

    logger.info(`Incoming request: ${context.req.method} ${context.req.path}`);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger.warn("Missing or invalid Authorization header");
        return context.json(
            {
                error: true,
                message: "Missing or invalid Authorization header",
                code: "UNAUTHORIZED",
            },
            401
        );
    }

    const requestId = context.req.header("X-Request-ID") || crypto.randomUUID();

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    try {
        const tokenService =
            authContainer.resolve<JWTTokenService>("JwtTokenGenerator");

        const decoded = tokenService.decodeToken(token);
        if (!decoded) {
            logger.error("Failed to decode token", undefined, { token });
            return ResponseMapper.error(
                {
                    error: true,
                    message: "Invalid token format",
                    code: "INVALID_TOKEN",
                    statusCode: 401,
                },
                requestId
            );
        }

        const type = decoded.type;
        const payload =
            type === "access"
                ? verifyAuthenticationMiddleware(token, tokenService, logger)
                : verifyAnonTokenMiddleware(token, tokenService, logger);
        if (!payload) {
            logger.error("Token verification failed", undefined, { token });
            return ResponseMapper.error(
                {
                    error: true,
                    message: "Invalid or expired token",
                    code: "INVALID_TOKEN",
                    statusCode: 401,
                },
                requestId
            );
        }

        if (payload.role === "anon") {
            logger.info("Anonymous user authenticated");
        } else if (payload.role === "authenticated") {
            if (!payload.sub) {
                return ResponseMapper.error(
                    {
                        error: true,
                        message: "Invalid token payload: missing subject",
                        code: "INVALID_TOKEN",
                        statusCode: 401,
                    },
                    requestId
                );
            }
            logger.info("Authenticated user logged in");
            context.set("user", mapUser(payload));
            context.set("userId", payload.sub);
        } else {
            return ResponseMapper.error(
                {
                    error: true,
                    message: "Invalid token payload: unknown role",
                    code: "INVALID_TOKEN",
                    statusCode: 401,
                },
                requestId
            );
        }

        await next();
    } catch (error) {
        logger.error(
            "Error during authentication middleware execution",
            undefined,
            { error: (error as Error)?.message ?? (error as any)?.error ?? "" }
        );
        return ResponseMapper.error(
            {
                error: true,
                message: "Invalid or expired token",
                code: "INVALID_TOKEN",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            requestId
        );
    }
}

export async function authenticatedUserMiddleware(
    context: Context,
    next: Next
) {
    const user = context.get("user");
    if (!user?.userId) {
        return context.json(
            {
                error: true,
                message: "User not authenticated",
                code: "UNAUTHORIZED",
            },
            401
        );
    }

    await next();
}
