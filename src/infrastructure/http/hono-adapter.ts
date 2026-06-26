import { Context } from "hono";
import { ZodTypeAny } from "zod/v3";
import { requestContext } from "../logging/request-context";
import { createLogger } from "../logging/logger";
import { ResponseMapper } from "../../utils/map-error";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { ValidationChainBuilder } from "./validators/validation-chain-builder";
import { UserPayload } from "./middleware/auth.middleware";

export interface RouteConfig<
    TInput,
    TQuery = unknown,
    TParams = unknown,
    THeaders = unknown,
    TCookies = unknown,
> {
    functionName: string;
    inputSchema?: ZodTypeAny;
    querySchema?: ZodTypeAny;
    paramsSchema?: ZodTypeAny;
    headersSchema?: ZodTypeAny;
    cookiesSchema?: ZodTypeAny;
}

export interface RouteContext<
    TInput,
    TQuery = unknown,
    TParams = unknown,
    THeaders = unknown,
    TCookies = unknown,
> {
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
    user?: UserPayload;
}

/**
 * Creates a Hono route handler with validation and error handling.
 * Template parameters allow typing of input, query, params, headers, and cookies.
 *
 * @param config {@link RouteConfig}
 * @param handler {@link RouteContext} => Promise<TOutput>
 * @returns
 */
export function createRoute<
    TInput = unknown,
    TOutput = unknown,
    TQuery = unknown,
    TParams = unknown,
    THeaders = unknown,
    TCookies = unknown,
>(
    config: RouteConfig<TInput, TQuery, TParams, THeaders, TCookies>,
    handler: (
        ctx: RouteContext<TInput, TQuery, TParams, THeaders, TCookies>
    ) => Promise<TOutput>
) {
    return async (honoContext: Context) => {
        const requestId =
            requestContext.getRequestId() ||
            honoContext.req.header("X-Request-ID") ||
            crypto.randomUUID();

        const logger = createLogger(config.functionName);
        const startTime = Date.now();

        const ipAddress =
            honoContext.req.header("CF-Connecting-IP") ||
            honoContext.req.header("X-Forwarded-For")?.split(",")[0].trim() ||
            honoContext.req.header("X-Real-IP") ||
            "127.0.0.1";

        const userAgent = honoContext.req.header("User-Agent") || null;

        try {
            logger.info("Request started", {
                method: honoContext.req.method,
                path: honoContext.req.path,
                ipAddress,
                userAgent,
            });

            const validationChain = ValidationChainBuilder.build({
                inputSchema: config.inputSchema,
                querySchema: config.querySchema,
                paramsSchema: config.paramsSchema,
                headersSchema: config.headersSchema,
                cookiesSchema: config.cookiesSchema,
            });

            const validatedData = {} as {
                input?: TInput;
                query?: TQuery;
                params?: TParams;
                headers?: THeaders;
                cookies?: TCookies;
            };

            const validationContext = {
                c: honoContext,
                logger,
                requestId,
                validatedData,
            };

            const validationResult =
                await validationChain.validate(validationContext);

            if (!validationResult.success) {
                honoContext.header("X-Request-ID", requestId);
                return honoContext.json(
                    {
                        error: true,
                        message: validationResult.error!.message,
                        request_id: requestId,
                    },
                    validationResult.error!.statusCode as ContentfulStatusCode
                );
            }

            const user = honoContext.get("user") as UserPayload;
            if (user) {
                logger.info("User authenticated", { userId: user.userId });
            } else {
                logger.info("No authenticated user found in context");
            }

            const result = await handler({
                input: validationContext.validatedData.input as TInput,
                query: validationContext.validatedData.query as TQuery,
                params: validationContext.validatedData.params as TParams,
                headers: validationContext.validatedData.headers as THeaders,
                cookies: validationContext.validatedData.cookies as TCookies,
                user,
                logger,
                requestId,
                c: honoContext,
                getHeader: (name: string) =>
                    honoContext.req.header(name) || null,
                ipAddress,
                userAgent,
            });

            const duration = Date.now() - startTime;
            logger.info("Request completed successfully", {
                durationMs: duration,
            });

            honoContext.header("X-Request-ID", requestId);
            return ResponseMapper.success(result, requestId);
        } catch (error: unknown) {
            const duration = Date.now() - startTime;
            logger.error("Request failed", error, { durationMs: duration });

            const errorResponse = ResponseMapper.toJSON(error, requestId);
            honoContext.header("X-Request-ID", requestId);
            return honoContext.json(
                errorResponse,
                (errorResponse.statusCode || 500) as ContentfulStatusCode
            );
        }
    };
}
