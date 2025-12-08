import { Hono } from "hono";
import { characterLinkRoute } from "./link";
import { characterLinkedRoute } from "./linked";
import { characterUnlinkRoute } from "./unlink";

const characterRoutes = new Hono();

characterRoutes.route("/link", characterLinkRoute);
characterRoutes.route("/linked", characterLinkedRoute);
characterRoutes.route("/unlink", characterUnlinkRoute);

export default characterRoutes;
