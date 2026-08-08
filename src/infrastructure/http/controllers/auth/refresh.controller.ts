import { GetSessionUseCase } from "@use-cases/login/get-session.usecase";

export class RefreshTokenController {
    constructor(private readonly getSessionUseCase: GetSessionUseCase) {}

    async handle(input: {
        sessionId: string;
        ipAddress?: string;
        userAgent?: string;
    }) {
        const result = await this.getSessionUseCase.execute(
            input.sessionId,
            input.ipAddress ?? "",
            input.userAgent ?? ""
        );

        return {
            sessionId: result.sessionId,
            accessToken: result.accessToken,
            accessTokenExpiresAt: result.accessTokenExpiresAt,
            refreshTokenExpiresAt: result.refreshTokenExpiresAt,
            provider: result.provider,
        };
    }
}
