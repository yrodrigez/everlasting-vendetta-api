import { DatabaseClientFactory } from "@database/database-client-factory";
import { createRoute } from "@http/hono-adapter";
import { RefreshInput, refreshSchema } from "@http/validators/schemas/auth-schema";
import { RefreshUserSessionTokenUseCase } from "@use-cases/refresh-user-session-token";
import { Hono } from "hono";
import { getEnvironment } from "src/infrastructure/environment";
import { AuthRepository } from "src/infrastructure/repositories/auth-repository";
import { PermissionRepository } from "src/infrastructure/repositories/permission-repository";
import { RoleRepository } from "src/infrastructure/repositories/role-repository";
import { JWTTokenService } from "src/infrastructure/security/jwt-token-service";

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
        const { jwtKid, jwtSecret } = getEnvironment()
        const tokenService = new JWTTokenService(jwtSecret, jwtSecret, jwtKid);
        const rolesRepository = new RoleRepository(database);
        const permissionsRepository = new PermissionRepository(database);
        const usecase = new RefreshUserSessionTokenUseCase(
            authRepository,
            tokenService,
            rolesRepository,
            permissionsRepository
        )

        const newTokenPair = await usecase.execute({
            refreshToken,
            ipAddress,
            userAgent
        });

        return newTokenPair;
    }));

export { refreshRoute };