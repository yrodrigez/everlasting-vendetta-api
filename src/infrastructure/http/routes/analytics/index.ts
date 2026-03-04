import { Hono } from "hono";
import sendEventRoute from "./send-event-route";

const analyticsRoutes = new Hono();

analyticsRoutes.route("/send", sendEventRoute);

export default analyticsRoutes;
