import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { authContainer } from "@infrastructure/di/auth/auth.container";
import { Hono } from "hono";
import { StorePort } from "src/application/ports/store/store.port";

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

            const currentUserId = user.userId;
            const store = authContainer.resolve<StorePort>("RedisStore");
            const key = `selected_character:${currentUserId}`;

            return await store.get(key);
        }
    )
);

export { getSelectedCharacterRoute };
