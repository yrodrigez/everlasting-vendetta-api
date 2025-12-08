import { Hono } from "hono";
import { realmsRoute } from "./allowed";

const realmsRoutes = new Hono();

realmsRoutes.route("/allowed", realmsRoute);

export default realmsRoutes;
