import {
    DatabaseClient,
    DatabaseClientFactory,
} from "@database/database-client-factory";
import { IEventTrackingService } from "@domain/services/i-event-tracking-service";
import { ITokenService } from "@domain/services/i-token-service";
import { UserContextService } from "@domain/services/user-context-service";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import WowAccountService from "@external/wow-account-service";
import { WowCharacterService } from "@external/wow-character-service";
import { RedisConfig } from "@infrastructure/config/redis.config";
import { getEnvironment } from "@infrastructure/environment";
import { RedisStore } from "@infrastructure/redis/redis-store";
import { AuthRepository } from "@infrastructure/repositories/auth-repository";
import { BannedRepository } from "@infrastructure/repositories/banned-repository";
import { MemberRepository } from "@infrastructure/repositories/member-repository";
import { PermissionRepository } from "@infrastructure/repositories/permission-repository";
import { RealmsRepository } from "@infrastructure/repositories/realms-repository";
import { RoleRepository } from "@infrastructure/repositories/role-repository";
import { WowAccountRepository } from "@infrastructure/repositories/wow-account-repository";
import { JWTTokenService } from "@infrastructure/security/jwt-token-service";
import { EventTrackingService } from "@infrastructure/services/event-tracking-service";
import { IAuthRepository } from "@repositories/i-auth-repository";
import { IBannedRepository } from "@repositories/i-banned-repository";
import { IMemberRepository } from "@repositories/i-member-repository";
import { IPermissionRepository } from "@repositories/i-permission-repository";
import { IRealmsRepository } from "@repositories/i-realms-repository";
import { IRoleRepository } from "@repositories/i-role-repository";
import { IWowAccountRepository } from "@repositories/i-wow-account-repository";
import { AuthenticateWithBattleNetUseCase } from "@use-cases/auth-with-battlenet-usecase";
import { AuthenticateWithDiscordUseCase } from "@use-cases/auth-with-discord-usecase";
import { LoginUseCase } from "@use-cases/login/login.usecase";
import { RefreshSessionTokenUseCase } from "@use-cases/refresh-user-session-token";
import { Container } from "../container";
import { GetSessionUseCase } from "@use-cases/login/get-session.usecase";
import { StorePort } from "src/application/ports/store/store.port";

export const authContainer = new Container();

authContainer.singleton<DatabaseClient>("DatabaseClient", () =>
    DatabaseClientFactory.getInstance()
);

authContainer.singleton<StorePort>("RedisStore", () => {
    const redisConfig = new RedisConfig();
    return new RedisStore(redisConfig);
});

authContainer.singleton<BlizzardOauthService>("BlizzardOauthService", () => {
    return new BlizzardOauthService();
});

authContainer.singleton<IAuthRepository>("AuthRepository", (c) => {
    const databaseClient = c.resolve<DatabaseClient>("DatabaseClient");
    return new AuthRepository(databaseClient);
});

authContainer.singleton<IMemberRepository>("MemberRepository", (c) => {
    const databaseClient = c.resolve<DatabaseClient>("DatabaseClient");
    return new MemberRepository(databaseClient);
});

authContainer.singleton<IRoleRepository>("RoleRepository", (c) => {
    const databaseClient = c.resolve<DatabaseClient>("DatabaseClient");
    return new RoleRepository(databaseClient);
});

authContainer.singleton<IPermissionRepository>("PermissionRepository", (c) => {
    const databaseClient = c.resolve<DatabaseClient>("DatabaseClient");
    return new PermissionRepository(databaseClient);
});

authContainer.singleton<ITokenService>("JwtTokenGenerator", () => {
    const { jwtSecret, jwtKid, jwtRefreshSecret } = getEnvironment();
    return new JWTTokenService(jwtSecret, jwtRefreshSecret, jwtKid);
});

authContainer.singleton<IBannedRepository>("BannedRepository", (c) => {
    const databaseClient = c.resolve<DatabaseClient>("DatabaseClient");
    return new BannedRepository(databaseClient);
});

authContainer.singleton<IWowAccountRepository>("AccountRepository", (c) => {
    const databaseClient = c.resolve<DatabaseClient>("DatabaseClient");
    return new WowAccountRepository(databaseClient);
});

authContainer.singleton<IRealmsRepository>("RealmsRepository", (c) => {
    const databaseClient = c.resolve<DatabaseClient>("DatabaseClient");
    return new RealmsRepository(databaseClient);
});

authContainer.singleton("UserContextService", (c) => {
    const roleRepository = c.resolve<IRoleRepository>("RoleRepository");
    const permissionsRepository = c.resolve<IPermissionRepository>(
        "PermissionRepository"
    );
    const authRepository = c.resolve<IAuthRepository>("AuthRepository");
    const bansRepository = c.resolve<IBannedRepository>("BannedRepository");
    const realmsRepository = c.resolve<IRealmsRepository>("RealmsRepository");
    const memberRepository = c.resolve<IMemberRepository>("MemberRepository");
    const userContextService = new UserContextService(
        roleRepository,
        permissionsRepository,
        authRepository,
        bansRepository,
        realmsRepository,
        memberRepository
    );
    return userContextService;
});

authContainer.singleton("AuthenticateWithBattleNetUseCase", (c) => {
    const environment = getEnvironment();
    const wowAccountService = new WowAccountService(
        environment.profileNamespaces
    );
    const characterService = new WowCharacterService();
    const blizzardOAuthService = c.resolve<BlizzardOauthService>(
        "BlizzardOauthService"
    );
    const authRepository = c.resolve<IAuthRepository>("AuthRepository");
    const memberRepository = c.resolve<IMemberRepository>("MemberRepository");
    const tokenService = c.resolve<ITokenService>("JwtTokenGenerator");
    const userContextService =
        c.resolve<UserContextService>("UserContextService");
    const wowAccountRepository =
        c.resolve<IWowAccountRepository>("AccountRepository");
    const battlenetAuthUseCase = new AuthenticateWithBattleNetUseCase(
        blizzardOAuthService,
        authRepository,
        wowAccountService,
        characterService,
        memberRepository,
        tokenService,
        userContextService,
        wowAccountRepository,
        environment.currentRealms.map((r) => ({ slug: r.slug }))
    );
    return battlenetAuthUseCase;
});

authContainer.singleton("AuthenticateWithDiscordUseCase", (c) => {
    const authRepository = c.resolve<IAuthRepository>("AuthRepository");
    const tokenService = c.resolve<ITokenService>("JwtTokenGenerator");
    const userContextService =
        c.resolve<UserContextService>("UserContextService");
    const discordAuthUseCase = new AuthenticateWithDiscordUseCase(
        authRepository,
        tokenService,
        userContextService
    );
    return discordAuthUseCase;
});

authContainer.singleton<LoginUseCase>("LoginUseCase", (c) => {
    const authenticateWithBattleNetUseCase =
        c.resolve<AuthenticateWithBattleNetUseCase>(
            "AuthenticateWithBattleNetUseCase"
        );
    const authenticateWithDiscordUseCase =
        c.resolve<AuthenticateWithDiscordUseCase>(
            "AuthenticateWithDiscordUseCase"
        );
    const store = c.resolve<StorePort>("RedisStore");

    const loginUseCase = new LoginUseCase(
        authenticateWithBattleNetUseCase,
        authenticateWithDiscordUseCase,
        store
    );
    return loginUseCase;
});

authContainer.singleton<IEventTrackingService>("WowAccountService", () => {
    const eventTrackingService = new EventTrackingService();
    return eventTrackingService;
});

authContainer.singleton<RefreshSessionTokenUseCase>(
    "RefreshTokenUseCase",
    (c) => {
        const authRepository = c.resolve<IAuthRepository>("AuthRepository");
        const tokenService = c.resolve<ITokenService>("JwtTokenGenerator");
        const userContextService =
            c.resolve<UserContextService>("UserContextService");
        const eventTracker =
            c.resolve<IEventTrackingService>("WowAccountService");
        const usecase = new RefreshSessionTokenUseCase(
            authRepository,
            tokenService,
            userContextService,
            eventTracker
        );
        return usecase;
    }
);

authContainer.singleton<GetSessionUseCase>("GetSessionUseCase", (c) => {
    const refreshTokenUseCase = c.resolve<RefreshSessionTokenUseCase>(
        "RefreshTokenUseCase"
    );
    const store = c.resolve<StorePort>("RedisStore");

    return new GetSessionUseCase(refreshTokenUseCase, store);
});
