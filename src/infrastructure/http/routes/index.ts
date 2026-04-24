import { Hono } from "hono";
import wowRoutes from "./wow-routes";
import authRoutes from "./auth";
import { gearscoreRoutes } from "./gearscore-route";
import realmsRoutes from "./realms";
import characterRoutes from "./characters";
import { raidRoutes } from "./raid";
import analyticsRoutes from "./analytics";
import discordRoutes from "./discord";
import resetRoutes from "./reset";

const routes = new Hono();

// Health check
routes.get("/health", (c) => {
    return c.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Mount route modules
routes.route("/wow", wowRoutes);
routes.route("/auth", authRoutes);
routes.route("/gearscore", gearscoreRoutes);
routes.route("/realms", realmsRoutes);
routes.route("/auth/characters", characterRoutes);
routes.route("/raids", raidRoutes);
routes.route("/reset", resetRoutes);
routes.route("/analytics", analyticsRoutes);
routes.route("/discord", discordRoutes);

export { routes };
