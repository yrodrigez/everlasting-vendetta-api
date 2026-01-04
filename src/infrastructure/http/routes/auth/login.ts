// auth-refresh
import { DatabaseClientFactory } from "@database/database-client-factory";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import WowAccountService from "@external/wow-account-service";
import { WowCharacterService } from "@external/wow-character-service";
import { createRoute } from "@http/hono-adapter";
import { loginSchema, LoginInput } from "@http/validators/schemas/auth-schema";
import { AuthenticateWithBattleNetUseCase } from "@use-cases/auth-with-battlenet-usecase";
import { AuthenticateWithDiscordUseCase } from "@use-cases/auth-with-discord-usecase";
import { Hono } from "hono";
import { getEnvironment } from "src/infrastructure/environment";
import { AuthRepository } from "src/infrastructure/repositories/auth-repository";
import { MemberRepository } from "src/infrastructure/repositories/member-repository";
import { PermissionRepository } from "src/infrastructure/repositories/permission-repository";
import { RoleRepository } from "src/infrastructure/repositories/role-repository";
import { BannedRepository } from "src/infrastructure/repositories/banned-repository";
import { JWTTokenService } from "src/infrastructure/security/jwt-token-service";
import { WowAccountRepository } from "src/infrastructure/repositories/wow-account-repository";
import { UserContextService } from "src/domain/services/user-context-service";
import { RealmsRepository } from "@infrastructure/repositories/realms-repository";

const loginRoute = new Hono();

loginRoute.post(createRoute<LoginInput>(
    {
        functionName: "auth-login",
        inputSchema: loginSchema,
    },
    async ({ input: { access_token, provider, expires_at, refresh_token }, ipAddress, userAgent }) => {

        const databaseClient = DatabaseClientFactory.getInstance();
        const blizzardOAuthService = new BlizzardOauthService();
        const authRepository = new AuthRepository(databaseClient);
        const memberRepository = new MemberRepository(databaseClient);
        const roleRepository = new RoleRepository(databaseClient);
        const permissionsRepository = new PermissionRepository(databaseClient);
        const { jwtSecret, jwtKid, jwtRefreshSecret } = getEnvironment();
        const tokenService = new JWTTokenService(jwtSecret, jwtRefreshSecret, jwtKid);
        const bansRepository = new BannedRepository(databaseClient);
        const wowAccountRepository = new WowAccountRepository(databaseClient);
        const realmsRepository = new RealmsRepository(databaseClient);
        const userContextService = new UserContextService(
            roleRepository,
            permissionsRepository,
            authRepository,
            bansRepository,
            realmsRepository,
            memberRepository,
        );

        if (provider === 'bnet' || provider === 'bnet_oauth') {
            const wowAccountService = new WowAccountService(access_token);
            const characterService = new WowCharacterService(access_token);
            const battlenetAuthUseCase = new AuthenticateWithBattleNetUseCase(
                blizzardOAuthService,
                authRepository,
                wowAccountService,
                characterService,
                memberRepository,
                tokenService,
                userContextService,
                wowAccountRepository,
            )
            return await battlenetAuthUseCase.execute({
                bnetToken: access_token,
                expires_at,
                provider: 'bnet_oauth',
                ipAddress: ipAddress || undefined,
                userAgent: userAgent || undefined
            });
        }

        if (provider === 'discord' || provider === 'discord_oauth') {
            const discordAuthUseCase = new AuthenticateWithDiscordUseCase(
                authRepository,
                tokenService,
                userContextService,
            );
            return await discordAuthUseCase.execute({
                discordToken: access_token,
                expires_at,
                ipAddress: ipAddress || undefined,
                userAgent: userAgent || undefined,
                refreshToken: refresh_token || undefined,
            });
        }

        throw new Error("Provider not supported");

    }
));

export { loginRoute };