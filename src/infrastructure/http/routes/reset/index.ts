import { Hono } from "hono";
import { calculateResetRaidReadinessScoreRoute } from "./calculate-rrs";

const resetRoutes = new Hono();

resetRoutes.route("/", calculateResetRaidReadinessScoreRoute);

export default resetRoutes;
