import { Context } from "hono";
import { z } from "zod";
import { requestContext } from "../logging/request-context";
import { createLogger } from "../logging/logger";
import { ResponseMapper } from "../../utils/map-error";
import { ContentfulStatusCode } from "hono/utils/http-status";

export interface RouteConfig<TInput> {
    functionName: string;
    inputSchema?: z.ZodSchema<TInput>;
}

export interface RouteContext<TInput> {
    input: TInput;
    logger: ReturnType<typeof createLogger>;
    requestId: string;
    c: Context;
    getHeader: (name: string) => string | null;
    ipAddress: string | null;
    userAgent: string | null;
}

/**
 * Adapter that wraps use case handlers for Hono routes
 * Maintains clean architecture by providing a consistent context interface
 */
export function createRoute<TInput = unknown, TOutput = unknown>(
    config: RouteConfig<TInput>,
    handler: (ctx: RouteContext<TInput>) => Promise<TOutput>
) {
    return async (c: Context) => {
        const requestId = c.req.header("X-Request-ID") || crypto.randomUUID();

        return requestContext.run({ requestId }, async () => {
            const logger = createLogger(config.functionName);
            const startTime = Date.now();

            // Get client IP address
            // In production: CF-Connecting-IP is set by Cloudflare
            // In local dev: defaults to localhost
            const ipAddress = c.req.header("CF-Connecting-IP") ||
                             c.req.header("X-Forwarded-For")?.split(',')[0].trim() ||
                             c.req.header("X-Real-IP") ||
                             "127.0.0.1"; // localhost for dev

            // Get user agent
            const userAgent = c.req.header("User-Agent") || null;

            try {
                logger.info("Request started", {
                    method: c.req.method,
                    path: c.req.path,
                    ipAddress,
                    userAgent,
                });

                // Parse and validate input
                let input: TInput;

                if (c.req.method === "GET" || c.req.method === "DELETE") {
                    // For GET/DELETE, use query params or empty object
                    input = {} as TInput;
                } else if (config.inputSchema) {
                    // Validate body with schema
                    let body;
                    try {
                        body = await c.req.json();
                    } catch (jsonError) {
                        logger.error("Failed to parse JSON body", jsonError);
                        c.header("X-Request-ID", requestId);
                        return c.json(
                            {
                                error: "Bad Request",
                                message: "Invalid JSON in request body",
                                request_id: requestId,
                            },
                            400
                        );
                    }

                    const parsed = config.inputSchema.safeParse(body);

                    if (!parsed.success) {
                        console.log(parsed.error);
                        logger.error("Request validation failed", {
                            errors: parsed.error.issues.map(issue => issue.message).join("; "),
                        });

                        c.header("X-Request-ID", requestId);
                        return c.json(
                            {
                                error: true,
                                message: "Invalid request body",
                                request_id: requestId,
                            },
                            400
                        );
                    }

                    input = parsed.data;
                } else {
                    try {
                        input = await c.req.json();
                    } catch {
                        input = {} as TInput;
                    }
                }

                // Execute handler with clean architecture context
                const result = await handler({
                    input,
                    logger,
                    requestId,
                    c,
                    getHeader: (name: string) => c.req.header(name) || null,
                    ipAddress,
                    userAgent,
                });

                const duration = Date.now() - startTime;
                logger.info("Request completed successfully", {
                    durationMs: duration,
                });

                c.header("X-Request-ID", requestId);
                return c.json(result, 200);
            } catch (error: unknown) {
                const duration = Date.now() - startTime;
                logger.error("Request failed", error, { durationMs: duration });

                const errorResponse = ResponseMapper.toJSON(error, requestId);
                c.header("X-Request-ID", requestId);
                return c.json(
                    errorResponse,
                    (errorResponse.statusCode || 500) as ContentfulStatusCode
                );
            }
        });
    };
}
