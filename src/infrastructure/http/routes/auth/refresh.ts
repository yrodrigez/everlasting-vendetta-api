import { createRoute } from "@http/hono-adapter";
import {
    RefreshInput,
    refreshSchema,
} from "@http/validators/schemas/auth-schema";
import { authContainer } from "@infrastructure/di/auth/auth.container";
import { createLogger } from "@infrastructure/logging/logger";
import { GetSessionUseCase } from "@use-cases/login/get-session.usecase";
import { Hono } from "hono";
const refreshRoute = new Hono();
const logger = createLogger("RefreshRoute");
refreshRoute.post(
    createRoute<RefreshInput>(
        {
            functionName: "auth-refresh",
            inputSchema: refreshSchema,
        },
        async ({ ipAddress, userAgent, input }) => {
            logger.info(
                `Received refresh request from IP: ${ipAddress}, User-Agent: ${userAgent}`
            );
            const getSessionUseCase =
                authContainer.resolve<GetSessionUseCase>("GetSessionUseCase");

            const result = await getSessionUseCase.execute(
                input.sessionId,
                ipAddress ?? "",
                userAgent ?? ""
            );

            logger.info("Returning refreshed session");
            return {
                sessionId: result.sessionId,
                accessToken: result.accessToken,
                accessTokenExpiresAt: result.accessTokenExpiresAt,
                refreshTokenExpiresAt: result.refreshTokenExpiresAt,
                provider: result.provider,
            };
        }
    )
);

export { refreshRoute };
