import { Hono } from "hono";
import { getSelectedCharacterByDiscordIdRoute } from "./get-selected-character-by-discord-id";

const discordRoutes = new Hono();

discordRoutes.route(
    "/:discordId/selected-character",
    getSelectedCharacterByDiscordIdRoute
);

export default discordRoutes;
