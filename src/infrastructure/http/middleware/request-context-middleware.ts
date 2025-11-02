import { Context, Next } from "hono";
import { requestContext } from "src/infrastructure/logging/request-context";

export async function requestContextMiddleware(context: Context, next: Next) {
    const requestId = context.req.header("X-Request-ID") || crypto.randomUUID();

    context.header("X-Request-ID", requestId);

    await requestContext.run({ requestId }, async () => {
        await next();
    });
}
