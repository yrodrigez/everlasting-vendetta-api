import { Provider } from "@dto/auth/provider";
import { RouteContext } from "@http/hono-adapter";
import { LinkOAuthAccountUseCaseFactory } from "@infrastructure/factories/auth/link-oauth-account-usecase-factory";
import { LinkOAuthAccountUseCase } from "@use-cases/link-oauth-account-usecase";


export class LinkOauthAccountController {
    constructor(
        private readonly linkOAuthAccountUseCase: LinkOAuthAccountUseCase,
    ) { }
    async handle({ input: { provider, accessToken, refreshToken, tokenExpiresAt }, c: context }: RouteContext<{
        provider: Provider;
        accessToken: string;
        refreshToken?: string;
        tokenExpiresAt: number;
    }>) {
        const user = context.get("user");
        const userId = user?.userId;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        
        const result = await this.linkOAuthAccountUseCase.execute({
            userId,
            provider,
            accessToken,
            refreshToken: refreshToken || undefined,
            tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt * 1000) : new Date(Date.now() + 3600 * 1000),
        });

        return result;
    }
}