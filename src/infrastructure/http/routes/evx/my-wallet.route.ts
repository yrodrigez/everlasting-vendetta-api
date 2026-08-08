import { Hono, type MiddlewareHandler } from "hono";
import { CreateNewWalletUseCase } from "@use-cases/evx/wallets/create-new-wallet.usecase";
import { createRoute } from "@http/hono-adapter";
import { guildMemberMiddleware } from "@http/middleware/guild-member.middleware";

export function buildMyWalletRoute(
    useCase: CreateNewWalletUseCase,
    authMiddleware: MiddlewareHandler
) {
    const myWallet = new Hono();
    myWallet.post(
        "/wallets/me",
        authMiddleware,
        guildMemberMiddleware,
        createRoute({ functionName: "my-wallet" }, async ({ user }) => {
            if (!user) {
                return {
                    status: 401,
                    body: {
                        error: "Unauthorized",
                    },
                };
            }

            const wallet = await useCase.execute(user.userId);
            return {
                wallet,
            };
        })
    );

    return myWallet;
}
