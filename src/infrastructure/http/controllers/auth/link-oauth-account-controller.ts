import { Provider } from "@dto/auth/provider";
import { LinkOAuthAccountUseCase } from "@use-cases/link-oauth-account-usecase";

type LinkOauthAccountRequest = {
    userId: string;
    provider: Provider;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt: number;
};

export class LinkOauthAccountController {
    constructor(
        private readonly linkOAuthAccountUseCase: LinkOAuthAccountUseCase
    ) {}
    async handle({
        userId,
        provider,
        accessToken,
        refreshToken,
        tokenExpiresAt,
    }: LinkOauthAccountRequest) {
        const result = await this.linkOAuthAccountUseCase.execute({
            userId,
            provider,
            accessToken,
            refreshToken,
            tokenExpiresAt: tokenExpiresAt
                ? new Date(tokenExpiresAt * 1000)
                : new Date(Date.now() + 3600 * 1000),
        });

        return result;
    }
}
