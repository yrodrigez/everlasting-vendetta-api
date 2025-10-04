import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors.middleware";
import { loggerMiddleware } from "./middleware/logger.middleware";
import { routes } from "./routes";

export function createApp() {
    const app = new Hono();

    // Global middleware
    app.use("/*", corsMiddleware);
    app.use("/*", loggerMiddleware);

    // Root endpoint
    app.get("/", (c) => {
        return c.json({
            name: "Everlasting Vendetta API",
            version: "1.0.0",
            status: "running",
        });
    });

    // Mount all routes
    app.route("/api", routes);

    return app;
}
