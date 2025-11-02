import { IAuthRepository } from "@repositories/i-auth-repository";
import { TokenRevocationReason } from "src/domain/types/auth-types";

export interface RevokeAllTokensInput {
    userId: string;
    reason?: TokenRevocationReason;
}

export interface RevokeAllTokensOutput {
    success: boolean;
    message: string;
    revokedCount?: number;
}

export class RevokeAllTokensUseCase {
    constructor(
        private readonly authRepository: IAuthRepository
    ) { }

    async execute(input: RevokeAllTokensInput): Promise<RevokeAllTokensOutput> {
        const { userId, reason = 'logout_all' } = input;

        // Get current sessions count before revoking
        const sessions = await this.authRepository.getUserSessions(userId);
        const count = sessions.length;

        // Revoke all tokens for the user
        await this.authRepository.revokeAllUserTokens(userId, reason);

        return {
            success: true,
            message: `Successfully revoked all sessions`,
            revokedCount: count
        };
    }
}
