import { IAuthRepository } from "@repositories/i-auth-repository";
import { RefreshToken } from "@entities/auth/refresh-token";

export interface SessionInfo {
    id: string;
    jti: string;
    familyId: string;
    provider: string;
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    isCurrentSession: boolean;
}

export interface GetUserSessionsInput {
    userId: string;
    currentJti?: string; // JTI of the current access token to mark as current session
}

export interface GetUserSessionsOutput {
    sessions: SessionInfo[];
    totalCount: number;
}

export class GetUserSessionsUseCase {
    constructor(private readonly authRepository: IAuthRepository) {}

    async execute(input: GetUserSessionsInput): Promise<GetUserSessionsOutput> {
        const { userId, currentJti } = input;

        const refreshTokens = await this.authRepository.getUserSessions(userId);

        const sessions: SessionInfo[] = refreshTokens.map((token) => ({
            id: token.id,
            jti: token.jti,
            familyId: token.familyId,
            provider: token.provider,
            createdAt: token.createdAt.toISOString(),
            lastUsedAt: token.lastUsedAt?.toISOString() || null,
            expiresAt: token.expiresAt.toISOString(),
            ipAddress: token.ipAddress,
            userAgent: token.userAgent,
            isCurrentSession: currentJti ? token.jti === currentJti : false,
        }));

        return {
            sessions,
            totalCount: sessions.length,
        };
    }
}
