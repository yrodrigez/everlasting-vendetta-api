import { AuthError } from "@errors/auth-error";
import { Provider } from "@dto/auth/provider";
import { SessionOutput, StoredSession } from "@dto/auth/session.dto";
import { RefreshSessionTokenUseCase } from "@use-cases/refresh-user-session-token";
import { StorePort } from "src/application/ports/store/store.port";

export class GetSessionUseCase {
    constructor(
        private readonly refreshTokenUseCase: RefreshSessionTokenUseCase,
        private readonly store: StorePort
    ) {}

    async execute(
        sessionId: string,
        ipAddress: string,
        userAgent: string
    ): Promise<SessionOutput> {
        const keyId = `session:${sessionId}`;
        const session = await this.store.get<StoredSession>(keyId);
        if (!session) {
            throw new AuthError("Session not found", "SESSION_NOT_FOUND", 401);
        }

        if (session.refreshTokenExpiresAt * 1000 < Date.now()) {
            await this.store.remove(keyId); // Remove expired session from store
            throw new AuthError("Session expired", "SESSION_EXPIRED", 401);
        }

        if (session.accessTokenExpiresAt * 1000 < Date.now()) {
            const newTokenPair = await this.refreshTokenUseCase.execute({
                refreshToken: session.refreshToken,
                ipAddress,
                userAgent,
            });

            const newSession: StoredSession = {
                refreshToken: newTokenPair.refreshToken,
                accessToken: newTokenPair.accessToken,
                refreshTokenExpiresAt: newTokenPair.refreshTokenExpiry,
                accessTokenExpiresAt: newTokenPair.accessTokenExpiry,
                provider: newTokenPair.provider as Provider,
            };

            const ttl = Math.floor(
                (newSession.refreshTokenExpiresAt * 1000 - Date.now()) / 1000
            );
            if (ttl <= 0) {
                await this.store.remove(keyId);
                throw new AuthError("Session expired", "SESSION_EXPIRED", 401);
            }

            await this.store.set<StoredSession>(keyId, newSession, ttl);

            return {
                refreshToken: newSession.refreshToken,
                accessToken: newSession.accessToken,
                refreshTokenExpiresAt: newSession.refreshTokenExpiresAt,
                accessTokenExpiresAt: newSession.accessTokenExpiresAt,
                provider: newTokenPair.provider as Provider,
                sessionId,
            };
        }

        return {
            ...session,
            sessionId,
        };
    }
}
