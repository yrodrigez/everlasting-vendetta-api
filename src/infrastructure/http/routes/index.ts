import { Hono } from "hono";
import wowRoutes from "./wow-routes";
import authRoutes from "./auth";

const routes = new Hono();

// Health check
routes.get("/health", (c) => {
    return c.json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});

// Mount route modules
routes.route("/wow", wowRoutes);
routes.route("/auth", authRoutes);

export { routes };
