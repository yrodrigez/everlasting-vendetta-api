import { createRoute } from "@http/hono-adapter";
import { Hono, type MiddlewareHandler } from "hono";
import type { StorePort } from "src/application/ports/store/store.port";

export function buildGetSelectedCharacterRoute(
    store: StorePort,
    authMiddleware: MiddlewareHandler
) {
    const getSelectedCharacterRoute = new Hono();

    getSelectedCharacterRoute.get(
        "/",
        authMiddleware,
        createRoute(
            {
                functionName: "get-selected-character",
            },
            async ({ c }) => {
                const user = c.get("user");
                if (!user) {
                    throw new Error("User not authenticated");
                }

                const key = `selected_character:${user.userId}`;
                return store.get(key);
            }
        )
    );

    return getSelectedCharacterRoute;
}
