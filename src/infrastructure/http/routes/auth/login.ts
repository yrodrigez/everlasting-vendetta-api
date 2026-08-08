// auth-refresh
import { createRoute } from "@http/hono-adapter";
import { LoginInput, loginSchema } from "@http/validators/schemas/auth-schema";
import { Hono } from "hono";

import { LoginController } from "@http/controllers/auth/login.controller";

export function buildLoginRoute(controller: LoginController) {
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
                const result = await controller.handle({
                    access_token,
                    provider,
                    expires_at,
                    refresh_token,
                    ipAddress: ipAddress ?? undefined,
                    userAgent: userAgent ?? undefined,
                });

                return result;
            }
        )
    );
    return loginRoute;
}
