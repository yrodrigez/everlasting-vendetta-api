import {
    SessionInput,
    SessionOutput,
    StoredSession,
} from "@dto/auth/session.dto";
import { AuthError } from "@errors/auth-error";
import { createLogger } from "@infrastructure/logging/logger";
import { AuthenticateWithBattleNetUseCase } from "@use-cases/auth-with-battlenet-usecase";
import { AuthenticateWithDiscordUseCase } from "@use-cases/auth-with-discord-usecase";
import { StorePort } from "src/application/ports/store/store.port";
import { SessionId } from "src/application/value-objects/session-id.vo";

const logger = createLogger("LoginUseCase");

type LoginResult = StoredSession & {
    userId: string;
};

type SelectedCharacterMetadata = {
    realm?: {
        slug?: string | null;
    } | null;
    character?: {
        realm?: {
            slug?: string | null;
        } | null;
    } | null;
};

export class LoginUseCase {
    constructor(
        private readonly authenticateWithBattleNetUseCase: AuthenticateWithBattleNetUseCase,
        private readonly authenticateWithDiscordUseCase: AuthenticateWithDiscordUseCase,
        private readonly storePort: StorePort
    ) {}

    private async orchestrateLogin(input: SessionInput): Promise<LoginResult> {
        const {
            access_token,
            provider,
            expires_at,
            refresh_token,
            ipAddress,
            userAgent,
        } = input;
        if (provider === "bnet_oauth") {
            const result = await this.authenticateWithBattleNetUseCase.execute({
                bnetToken: access_token,
                expires_at,
                ipAddress: ipAddress ?? undefined,
                userAgent: userAgent ?? undefined,
            });
            return {
                ...result,
                provider: provider as "bnet_oauth",
            };
        }

        if (provider === "discord_oauth") {
            const result = await this.authenticateWithDiscordUseCase.execute({
                discordToken: access_token,
                expires_at,
                ipAddress: ipAddress ?? undefined,
                userAgent: userAgent ?? undefined,
                refreshToken: refresh_token ?? undefined,
            });
            return {
                ...result,
                provider: provider as "discord_oauth",
            };
        }
        throw new Error(`Unsupported provider: ${provider}`);
    }

    async execute(input: SessionInput): Promise<SessionOutput> {
        const loginResult = await this.orchestrateLogin(input);
        await this.ensureSelectedCharacterHasRealm(loginResult.userId);

        const session: StoredSession = {
            refreshToken: loginResult.refreshToken,
            accessToken: loginResult.accessToken,
            refreshTokenExpiresAt: loginResult.refreshTokenExpiresAt,
            accessTokenExpiresAt: loginResult.accessTokenExpiresAt,
            provider: loginResult.provider,
        };
        const sessionId = SessionId.generate();
        const ttl = Math.floor(
            (session.refreshTokenExpiresAt * 1000 - Date.now()) / 1000
        );
        if (ttl <= 0) {
            throw new AuthError(
                "Refresh token expired",
                "REFRESH_TOKEN_EXPIRED",
                401
            );
        }

        logger.info(`Storing session with TTL: ${ttl} seconds`);
        const keyId = `session:${sessionId.getValue()}`;
        await this.storePort.set<StoredSession>(keyId, session, ttl);
        return {
            ...session,
            sessionId: sessionId.getValue(),
        };
    }

    private async ensureSelectedCharacterHasRealm(
        userId: string
    ): Promise<void> {
        const key = `selected_character:${userId}`;
        const selectedCharacter =
            await this.storePort.get<SelectedCharacterMetadata>(key);

        if (!selectedCharacter) {
            return;
        }

        if (this.hasRealmSlug(selectedCharacter)) {
            return;
        }

        await this.storePort.remove(key);
        throw new AuthError(
            "Selected character is missing realm",
            "SELECTED_CHARACTER_MISSING_REALM",
            400
        );
    }

    private hasRealmSlug(
        selectedCharacter: SelectedCharacterMetadata
    ): boolean {
        const realmSlug =
            selectedCharacter.realm?.slug ??
            selectedCharacter.character?.realm?.slug ??
            "";

        return realmSlug.trim().length > 0;
    }
}
