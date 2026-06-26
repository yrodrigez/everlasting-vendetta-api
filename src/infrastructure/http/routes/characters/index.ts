import { Hono } from "hono";
import { characterLinkRoute } from "./link";
import { characterLinkedRoute } from "./linked";
import { setSelectedCharacterRoute } from "./set-selected-character";
import { characterUnlinkRoute } from "./unlink";
import { getSelectedCharacterRoute } from "./get-selected-character";

const characterRoutes = new Hono();

characterRoutes.route("/link", characterLinkRoute);
characterRoutes.route("/linked", characterLinkedRoute);
characterRoutes.route("/unlink", characterUnlinkRoute);
characterRoutes.route("/select", setSelectedCharacterRoute);
characterRoutes.route("/selected", getSelectedCharacterRoute);

export default characterRoutes;
