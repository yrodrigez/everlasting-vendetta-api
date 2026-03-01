import { Hono } from "hono";
import { addItemToRaidRoute } from "./add-item-to-raid";
import { getRaidsRoute } from "./get-raids";

const raidRoutes = new Hono();

raidRoutes.route("/", getRaidsRoute);
raidRoutes.route("/", addItemToRaidRoute);

export { raidRoutes };
