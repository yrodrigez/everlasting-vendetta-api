import { createRoute } from "@http/hono-adapter";
import { FindAllWalletsUseCase } from "@use-cases/evx/wallets/find-all-wallets.usecase";
import { Hono, type MiddlewareHandler } from "hono";
import { guildMemberMiddleware } from "@http/middleware/guild-member.middleware";

export function buildFindAllWalletsRoute(
    useCase: FindAllWalletsUseCase,
    authMiddleware: MiddlewareHandler
) {
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

                const wallets = await useCase.execute();
                return {
                    wallets: wallets ?? [],
                };
            }
        )
    );

    return findAllWalletsRoute;
}
