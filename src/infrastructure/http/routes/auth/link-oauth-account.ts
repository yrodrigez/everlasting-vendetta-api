import { LinkOauthAccountController } from "@http/controllers/auth/link-oauth-account-controller";
import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { LinkOAuthAccountSchema, linkOAuthAccountSchema } from "@http/validators/schemas/auth-schema";
import { LinkOAuthAccountUseCaseFactory } from "@infrastructure/factories/auth/link-oauth-account-usecase-factory";
import { Hono } from "hono";

const route = new Hono();

route.post('/',
    authMiddleware,
    createRoute<LinkOAuthAccountSchema>({
        functionName: "auth-link-oauth-account",
        inputSchema: linkOAuthAccountSchema,
    }, async (ctx) => {
        const usecase = LinkOAuthAccountUseCaseFactory.make();
        const controller = new LinkOauthAccountController(usecase);
        return controller.handle({
            ...ctx,
            input: {
                provider: ctx.input.provider,
                accessToken: ctx.input.accessToken,
                refreshToken: ctx.input.refreshToken,
                tokenExpiresAt: ctx.input.tokenExpiresAt,
            },
        });
    })
);

export const linkOAuthAccountRoute = route;