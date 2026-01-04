import { DatabaseClientFactory } from "@database/database-client-factory";
import { createRoute } from "@http/hono-adapter";
import { RefreshInput, refreshSchema } from "@http/validators/schemas/auth-schema";
import { RefreshUserSessionTokenUseCase } from "@use-cases/refresh-user-session-token";
import { Hono } from "hono";
import { getEnvironment } from "src/infrastructure/environment";
import { AuthRepository } from "src/infrastructure/repositories/auth-repository";
import { PermissionRepository } from "src/infrastructure/repositories/permission-repository";
import { RoleRepository } from "src/infrastructure/repositories/role-repository";
import { BannedRepository } from "src/infrastructure/repositories/banned-repository";
import { JWTTokenService } from "src/infrastructure/security/jwt-token-service";
import { UserContextService } from "src/domain/services/user-context-service";
import { RealmsRepository } from "@infrastructure/repositories/realms-repository";
import { MemberRepository } from "@infrastructure/repositories/member-repository";

const refreshRoute = new Hono();
refreshRoute.post(createRoute<RefreshInput>(
    {
        functionName: "auth-refresh",
        inputSchema: refreshSchema,
    },
    async ({ ipAddress, userAgent, input }) => {

        const refreshToken = input.refresh_token;
        const database = DatabaseClientFactory.getInstance();
        const authRepository = new AuthRepository(database);
        const { jwtKid, jwtSecret, jwtRefreshSecret } = getEnvironment()
        const tokenService = new JWTTokenService(jwtSecret, jwtRefreshSecret, jwtKid);
        const rolesRepository = new RoleRepository(database);
        const bansRepository = new BannedRepository(database);
        const permissionsRepository = new PermissionRepository(database);
        const realmsRepository = new RealmsRepository(database);
        const memberRepository = new MemberRepository(database);
        const userContextService = new UserContextService(
            rolesRepository,
            permissionsRepository,
            authRepository,
            bansRepository,
            realmsRepository,
            memberRepository,
        );
        const usecase = new RefreshUserSessionTokenUseCase(
            authRepository,
            tokenService,
            userContextService,
        )

        const newTokenPair = await usecase.execute({
            refreshToken,
            ipAddress,
            userAgent
        });

        return newTokenPair;
    }));

export { refreshRoute };