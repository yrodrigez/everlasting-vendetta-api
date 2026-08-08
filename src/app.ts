import { Hono } from "hono";
import { corsMiddleware } from "./infrastructure/http/middleware/cors.middleware";
import { loggerMiddleware } from "./infrastructure/http/middleware/logger.middleware";
import { buildRoutes } from "./infrastructure/http/routes";
import { requestContextMiddleware } from "./infrastructure/http/middleware/request-context-middleware";
import { appContainer } from "./infrastructure/di/app.container";
import type { Container } from "./infrastructure/di/container";

export function createApp(container: Container = appContainer) {
    const app = new Hono();

    // Global middleware
    app.use("/*", corsMiddleware);
    app.use("/*", loggerMiddleware);
    app.use("/*", requestContextMiddleware);

    // Root endpoint
    app.get("/", (c) => {
        return c.json({
            name: "Everlasting Vendetta API",
            version: "1.0.0",
            status: "running",
        });
    });

    // Mount all routes
    app.route("/api", buildRoutes(container));

    return app;
}
