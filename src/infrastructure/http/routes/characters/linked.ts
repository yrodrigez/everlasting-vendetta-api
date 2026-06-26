import { createRoute } from "@http/hono-adapter";
import { Hono } from "hono";
import { DatabaseClientFactory } from "@database/database-client-factory";
import { MemberRepository } from "@infrastructure/repositories/member-repository";
import { createLogger } from "@infrastructure/logging";
import { authMiddleware } from "@http/middleware/auth.middleware";

const characterLinkedRoute = new Hono();
const logger = createLogger("character-linked-route");

characterLinkedRoute.get(
    "/",
    authMiddleware,
    createRoute(
        {
            functionName: "get-linked-characters",
        },
        async ({ c }) => {
            const user = c.get("user");
            if (!user) {
                throw new Error("User not authenticated");
            }

            const currentUserId = user.userId;
            const databaseClient = DatabaseClientFactory.getInstance();
            const memberRepository = new MemberRepository(databaseClient);

            // Get all characters linked by this user
            const linkedCharacters =
                await memberRepository.findAllByUserId(currentUserId);

            logger.info(
                `Retrieved ${linkedCharacters.length} linked characters for user ${currentUserId}`
            );

            return {
                linkedCharacters,
            };
        }
    )
);

export { characterLinkedRoute };
