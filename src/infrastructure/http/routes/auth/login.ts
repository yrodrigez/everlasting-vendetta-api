// auth-refresh
import { DatabaseClientFactory } from "@database/database-client-factory";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import WowAccountService from "@external/wow-account-service";
import { WowCharacterService } from "@external/wow-character-service";
import { createRoute } from "@http/hono-adapter";
import { loginSchema, LoginInput } from "@http/validators/schemas/auth-schema";
import { AuthenticateWithBattleNetUseCase } from "@use-cases/auth-with-battlenet-usecase";
import { Hono } from "hono";
import { getEnvironment } from "src/infrastructure/environment";
import { AuthRepository } from "src/infrastructure/repositories/auth-repository";
import { MemberRepository } from "src/infrastructure/repositories/member-repository";
import { PermissionRepository } from "src/infrastructure/repositories/permission-repository";
import { RoleRepository } from "src/infrastructure/repositories/role-repository";
import { JWTTokenService } from "src/infrastructure/security/jwt-token-service";

const loginRoute = new Hono();

loginRoute.post(createRoute<LoginInput>(
    {
        functionName: "auth-login",
        inputSchema: loginSchema,
    },
    async ({ input: { access_token, provider, expires_at }, ipAddress, userAgent }) => {

        const databaseClient = DatabaseClientFactory.getInstance();
        const blizzardOAuthService = new BlizzardOauthService();
        const authRepository = new AuthRepository(databaseClient);
        const memberRepository = new MemberRepository(databaseClient);
        const roleRepository = new RoleRepository(databaseClient);
        const permissionsRepository = new PermissionRepository(databaseClient);
        const { jwtSecret, jwtKid } = getEnvironment();
        const tokenService = new JWTTokenService(jwtSecret, jwtSecret, jwtKid); // TODO: separate secrets

        if (provider === 'bnet') {
            const wowAccountService = new WowAccountService(access_token);
            const characterService = new WowCharacterService(access_token);
            const battlenetAuthUseCase = new AuthenticateWithBattleNetUseCase(
                blizzardOAuthService,
                authRepository,
                wowAccountService,
                characterService,
                memberRepository,
                roleRepository,
                permissionsRepository,
                tokenService
            )
            return await battlenetAuthUseCase.execute({
                bnetToken: access_token,
                expires_at,
                provider,
                ipAddress: ipAddress || undefined,
                userAgent: userAgent || undefined
            });
        }

        throw new Error("Provider not supported");

    }
));

export { loginRoute };