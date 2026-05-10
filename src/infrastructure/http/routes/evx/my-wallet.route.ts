import { Hono } from "hono";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { evxContainer } from "@infrastructure/di/evx/evx.container";
import { CreateNewWalletUseCase } from "@use-cases/evx/wallets/create-new-wallet.usecase";
import { createRoute } from "@http/hono-adapter";
import { guildMemberMiddleware } from "@http/middleware/guild-member.middleware";

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

        const usecase = evxContainer.resolve<CreateNewWalletUseCase>(
            "CreateNewWalletUseCase"
        );
        const wallet = await usecase.execute(user.userId);
        return {
            wallet,
        };
    })
);

export { myWallet };
