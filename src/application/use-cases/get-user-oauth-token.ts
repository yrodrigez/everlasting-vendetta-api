import { IAuthRepository } from "@repositories/i-auth-repository";
import { ITokenService } from "src/domain/services/i-token-service";

export class GetUserOauthToken {
    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly tokenService: ITokenService,
    ) { }
    async execute(accessToken: string): Promise<string | null> {
        const tokenData = this.tokenService.verifyAccessToken(accessToken);
        if (!tokenData || !tokenData.jti) {
            return null;
        }

        const { sub, provider } = tokenData;
        if (!sub || !provider) {
            return null;
        }
        const oauthProvider = await this.authRepository.getOauthProvider(sub, provider);
        if (!oauthProvider) {
            return null;
        }

        if (new Date(oauthProvider.expiresAt) < new Date()) {
            return null;
        }

        return oauthProvider.accessToken;
    }

}