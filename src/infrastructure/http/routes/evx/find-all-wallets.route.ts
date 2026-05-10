import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { evxContainer } from "@infrastructure/di/evx/evx.container";
import { FindAllWalletsUseCase } from "@use-cases/evx/wallets/find-all-wallets.usecase";
import { Hono } from "hono";
import { guildMemberMiddleware } from "@http/middleware/guild-member.middleware";

const findAllWalletsRoute = new Hono();

findAllWalletsRoute.get(
    "/wallets",
    authMiddleware,
    guildMemberMiddleware,
    createRoute(
        {
            functionName: "find-all-wallets",
        },
        async ({ user }) => {
            if (!user) {
                return {
                    status: 401,
                    body: {
                        error: "Unauthorized",
                    },
                };
            }

            if (!user.isAdmin) {
                return {
                    status: 403,
                    body: {
                        error: "User does not have permission to access this resource",
                    },
                };
            }

            const usecase = evxContainer.resolve<FindAllWalletsUseCase>(
                "FindAllWalletsUseCase"
            );
            const wallets = await usecase.execute();
            return {
                wallets: wallets ?? [],
            };
        }
    )
);

export { findAllWalletsRoute };
