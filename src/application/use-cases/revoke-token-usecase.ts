import { IAuthRepository } from "@repositories/i-auth-repository";
import { AuthError } from "@errors/auth-error";
import { TokenRevocationReason } from "src/domain/types/auth-types";
import { createLogger } from "src/infrastructure/logging";
import { IEventTrackingService } from "src/domain/services/i-event-tracking-service";

export interface RevokeTokenInput {
    userId: string;
    tokenJti: string;
    reason?: TokenRevocationReason;
}

export interface RevokeTokenOutput {
    success: boolean;
    message: string;
}

export class RevokeTokenUseCase {
    private readonly logger = createLogger('RevokeTokenUseCase');
    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly eventTracker: IEventTrackingService,
    ) { }

    async execute(input: RevokeTokenInput): Promise<RevokeTokenOutput> {
        const { userId, tokenJti, reason = 'manual' } = input;

        // Get the token to verify it belongs to the user
        this.logger.info(`User ${userId} is attempting to revoke token ${tokenJti}`);
        const token = await this.authRepository.getRefreshToken(tokenJti);

        if (!token) {
            throw new AuthError(
                'Token not found',
                'TOKEN_NOT_FOUND',
                404
            );
        }

        // Verify the token belongs to the requesting user
        if (token.userId !== userId) {
            throw new AuthError(
                'You do not have permission to revoke this token',
                'FORBIDDEN',
                403
            );
        }

        // Check if already revoked
        if (token.revoked) {
            throw new AuthError(
                'Token is already revoked',
                'TOKEN_ALREADY_REVOKED',
                400
            );
        }

        // Revoke the token
        await this.authRepository.revokeRefreshToken({
            tokenJti,
            reason
        });

        await this.eventTracker.track({
            event_name: 'token_revoke',
            event_type: 'auth',
            user_id: userId,
            metadata: { reason },
        });

        return {
            success: true,
            message: 'Token revoked successfully'
        };
    }
}
