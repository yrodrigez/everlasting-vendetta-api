import { Hono } from "hono";
import wowRoutes from "./wow-routes";
import { buildAuthRoutes } from "./auth";
import { gearscoreRoutes } from "./gearscore-route";
import realmsRoutes from "./realms";
import { buildCharacterRoutes } from "./characters";
import { raidRoutes } from "./raid";
import analyticsRoutes from "./analytics";
import discordRoutes from "./discord";
import resetRoutes from "./reset";
import { buildEvxRoutes } from "./evx";
import type { Container } from "@infrastructure/di/container";

export function buildRoutes(container: Container): Hono {
    const routes = new Hono();

    routes.get("/health", (c) => {
        return c.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });

    routes.route("/wow", wowRoutes);
    routes.route("/auth", buildAuthRoutes(container));
    routes.route("/gearscore", gearscoreRoutes);
    routes.route("/realms", realmsRoutes);
    routes.route("/auth/characters", buildCharacterRoutes(container));
    routes.route("/raids", raidRoutes);
    routes.route("/reset", resetRoutes);
    routes.route("/analytics", analyticsRoutes);
    routes.route("/discord", discordRoutes);
    routes.route("/evx", buildEvxRoutes(container));

    return routes;
}
