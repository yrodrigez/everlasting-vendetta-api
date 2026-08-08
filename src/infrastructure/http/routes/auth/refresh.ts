import { RefreshTokenController } from "@http/controllers/auth/refresh.controller";
import { createRoute } from "@http/hono-adapter";
import {
    RefreshInput,
    refreshSchema,
} from "@http/validators/schemas/auth-schema";
import { createLogger } from "@infrastructure/logging/logger";
import { Hono } from "hono";
const logger = createLogger("RefreshRoute");

export function buildRefreshSessionRoute(controller: RefreshTokenController) {
    const refreshRoute = new Hono();
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

                return controller.handle({
                    sessionId: input.sessionId,
                    ipAddress: ipAddress ?? undefined,
                    userAgent: userAgent ?? undefined,
                });
            }
        )
    );

    return refreshRoute;
}
