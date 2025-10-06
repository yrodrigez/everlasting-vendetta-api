import { Context } from "hono";
import { ZodTypeAny } from "zod/v3";
import { requestContext } from "../logging/request-context";
import { createLogger } from "../logging/logger";
import { ResponseMapper } from "../../utils/map-error";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { ValidationChainBuilder } from "./validators/validation-chain-builder";

export interface RouteConfig<TInput, TQuery = unknown, TParams = unknown, THeaders = unknown, TCookies = unknown> {
    functionName: string;
    inputSchema?: ZodTypeAny;
    querySchema?: ZodTypeAny;
    paramsSchema?: ZodTypeAny;
    headersSchema?: ZodTypeAny;
    cookiesSchema?: ZodTypeAny;
}

export interface RouteContext<TInput, TQuery = unknown, TParams = unknown, THeaders = unknown, TCookies = unknown> {
    input: TInput;
    query: TQuery;
    params: TParams;
    headers: THeaders;
    cookies: TCookies;
    logger: ReturnType<typeof createLogger>;
    requestId: string;
    c: Context;
    getHeader: (name: string) => string | null;
    ipAddress: string | null;
    userAgent: string | null;
}

export function createRoute<TInput = unknown, TOutput = unknown, TQuery = unknown, TParams = unknown, THeaders = unknown, TCookies = unknown>(
    config: RouteConfig<TInput, TQuery, TParams, THeaders, TCookies>,
    handler: (ctx: RouteContext<TInput, TQuery, TParams, THeaders, TCookies>) => Promise<TOutput>
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

                // Build validation chain
                const validationChain = ValidationChainBuilder.build({
                    inputSchema: config.inputSchema,
                    querySchema: config.querySchema,
                    paramsSchema: config.paramsSchema,
                    headersSchema: config.headersSchema,
                    cookiesSchema: config.cookiesSchema,
                });

                // Execute validation chain
                const validatedData = {} as {
                    input?: TInput;
                    query?: TQuery;
                    params?: TParams;
                    headers?: THeaders;
                    cookies?: TCookies;
                }

                const validationContext = {
                    c,
                    logger,
                    requestId,
                    validatedData,
                };

                const validationResult = await validationChain.validate(validationContext);

                if (!validationResult.success) {
                    c.header("X-Request-ID", requestId);
                    return c.json(
                        {
                            error: true,
                            message: validationResult.error!.message,
                            request_id: requestId,
                        },
                        validationResult.error!.statusCode as ContentfulStatusCode
                    );
                }

                // Execute handler with clean architecture context
                const result = await handler({
                    input: validationContext.validatedData.input as TInput,
                    query: validationContext.validatedData.query as TQuery,
                    params: validationContext.validatedData.params as TParams,
                    headers: validationContext.validatedData.headers as THeaders,
                    cookies: validationContext.validatedData.cookies as TCookies,
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
