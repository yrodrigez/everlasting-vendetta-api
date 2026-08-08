import { Provider } from "@dto/auth/provider";
import { LoginUseCase } from "@use-cases/login/login.usecase";

export class LoginController {
    constructor(private loginUseCase: LoginUseCase) {}
    async handle(input: {
        access_token: string;
        provider: Provider;
        expires_at: number;
        refresh_token?: string;
        ipAddress?: string;
        userAgent?: string;
    }) {
        const result = await this.loginUseCase.execute({
            access_token: input.access_token,
            provider: input.provider,
            expires_at: input.expires_at,
            refresh_token: input.refresh_token ?? undefined,
            ipAddress: input.ipAddress ?? undefined,
            userAgent: input.userAgent ?? undefined,
        });

        return {
            sessionId: result.sessionId,
            accessToken: result.accessToken,
            expiresAt: result.refreshTokenExpiresAt,
            accessTokenExpiresAt: result.accessTokenExpiresAt,
        };
    }
}
