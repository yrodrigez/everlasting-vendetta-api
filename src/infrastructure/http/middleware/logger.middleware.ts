import { Context, Next } from "hono";
import { createLogger } from "../../logging/logger";

export async function loggerMiddleware(c: Context, next: Next) {
    const logger = createLogger("http");
    const startTime = Date.now();

    logger.info("Incoming request", {
        method: c.req.method,
        path: c.req.path,
        userAgent: c.req.header("User-Agent"),
    });

    await next();

    const duration = Date.now() - startTime;
    logger.info("Request completed", {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: duration,
    });
}
