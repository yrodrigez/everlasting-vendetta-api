// auth-refresh
import { createRoute } from "@http/hono-adapter";
import { LoginInput, loginSchema } from "@http/validators/schemas/auth-schema";
import { Hono } from "hono";
import { authContainer } from "@infrastructure/di/auth/auth.container";
import { LoginUseCase } from "@use-cases/login/login.usecase";

const loginRoute = new Hono();

loginRoute.post(
    createRoute<LoginInput>(
        {
            functionName: "auth-login",
            inputSchema: loginSchema,
        },
        async ({
            input: { access_token, provider, expires_at, refresh_token },
            ipAddress,
            userAgent,
        }) => {
            const loginUseCase =
                authContainer.resolve<LoginUseCase>("LoginUseCase");

            const result = await loginUseCase.execute({
                access_token,
                provider,
                expires_at,
                refresh_token,
                ipAddress: ipAddress ?? undefined,
                userAgent: userAgent ?? undefined,
            });

            return {
                sessionId: result.sessionId,
                accessToken: result.accessToken,
                expiresAt: result.refreshTokenExpiresAt,
                accessTokenExpiresAt: result.accessTokenExpiresAt,
            };
        }
    )
);

export { loginRoute };
