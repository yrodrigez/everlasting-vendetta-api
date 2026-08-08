import type { IEventTrackingService } from "@domain/services/i-event-tracking-service";
import type { ITokenService } from "@domain/services/i-token-service";
import { UserContextService } from "@domain/services/user-context-service";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { DiscordApi } from "@external/discord-api";
import WowAccountService from "@external/wow-account-service";
import { WowCharacterService } from "@external/wow-character-service";
import { getEnvironment } from "@infrastructure/environment";
import { AuthRepository } from "@infrastructure/repositories/auth-repository";
import { BannedRepository } from "@infrastructure/repositories/banned-repository";
import { MemberRepository } from "@infrastructure/repositories/member-repository";
import { PermissionRepository } from "@infrastructure/repositories/permission-repository";
import { RealmsRepository } from "@infrastructure/repositories/realms-repository";
import { RoleRepository } from "@infrastructure/repositories/role-repository";
import { WowAccountRepository } from "@infrastructure/repositories/wow-account-repository";
import { JWTTokenService } from "@infrastructure/security/jwt-token-service";
import { EventTrackingService } from "@infrastructure/services/event-tracking-service";
import type { IAuthRepository } from "@repositories/i-auth-repository";
import type { IBannedRepository } from "@repositories/i-banned-repository";
import type { IDiscordApiClient } from "@repositories/i-discord-api-client";
import type { IMemberRepository } from "@repositories/i-member-repository";
import type { IPermissionRepository } from "@repositories/i-permission-repository";
import type { IRealmsRepository } from "@repositories/i-realms-repository";
import type { IRoleRepository } from "@repositories/i-role-repository";
import type { IWowAccountRepository } from "@repositories/i-wow-account-repository";
import { AuthenticateWithBattleNetUseCase } from "@use-cases/auth-with-battlenet-usecase";
import { AuthenticateWithDiscordUseCase } from "@use-cases/auth-with-discord-usecase";
import { GetMyProfileUseCase } from "@use-cases/get-my-profile-usecase";
import { GetUserSessionsUseCase } from "@use-cases/get-user-sessions-usecase";
import { LinkOAuthAccountUseCase } from "@use-cases/link-oauth-account-usecase";
import { GetSessionUseCase } from "@use-cases/login/get-session.usecase";
import { LoginUseCase } from "@use-cases/login/login.usecase";
import { RefreshSessionTokenUseCase } from "@use-cases/refresh-user-session-token";
import { RevokeAllTokensUseCase } from "@use-cases/revoke-all-tokens-usecase";
import { RevokeTokenUseCase } from "@use-cases/revoke-token-usecase";
import { SyncBattlenetMembersToUserUsecase } from "@use-cases/sync-battlenet-members-to-user-usecase";
import { SyncMembersToNewUserUseCase } from "@use-cases/sync-members-to-new-user-usecase";
import { type Container, createToken } from "../container";
import { DATABASE_TOKENS } from "../persistence/database.container";

export const AUTH_TOKENS = {
    AuthRepository: createToken<IAuthRepository>("AuthRepository"),
    MemberRepository: createToken<IMemberRepository>("MemberRepository"),
    RoleRepository: createToken<IRoleRepository>("RoleRepository"),
    PermissionRepository: createToken<IPermissionRepository>(
        "PermissionRepository"
    ),
    BannedRepository: createToken<IBannedRepository>("BannedRepository"),
    RealmsRepository: createToken<IRealmsRepository>("RealmsRepository"),
    WowAccountRepository: createToken<IWowAccountRepository>(
        "WowAccountRepository"
    ),
    JwtTokenGenerator: createToken<ITokenService>("JwtTokenGenerator"),
    EventTrackingService: createToken<IEventTrackingService>(
        "EventTrackingService"
    ),
    BlizzardOauthService: createToken<BlizzardOauthService>(
        "BlizzardOauthService"
    ),
    DiscordApiClient: createToken<IDiscordApiClient>("DiscordApiClient"),
    UserContextService: createToken<UserContextService>("UserContextService"),
    SyncBattlenetMembersToUserUseCase:
        createToken<SyncBattlenetMembersToUserUsecase>(
            "SyncBattlenetMembersToUserUseCase"
        ),
    SyncMembersToNewUserUseCase: createToken<SyncMembersToNewUserUseCase>(
        "SyncMembersToNewUserUseCase"
    ),
    AuthenticateWithBattleNetUseCase:
        createToken<AuthenticateWithBattleNetUseCase>(
            "AuthenticateWithBattleNetUseCase"
        ),
    AuthenticateWithDiscordUseCase: createToken<AuthenticateWithDiscordUseCase>(
        "AuthenticateWithDiscordUseCase"
    ),
    LinkOAuthAccountUseCase: createToken<LinkOAuthAccountUseCase>(
        "LinkOAuthAccountUseCase"
    ),
    LoginUseCase: createToken<LoginUseCase>("LoginUseCase"),
    RefreshTokenUseCase: createToken<RefreshSessionTokenUseCase>(
        "RefreshTokenUseCase"
    ),
    GetSessionUseCase: createToken<GetSessionUseCase>("GetSessionUseCase"),
    GetMyProfileUseCase: createToken<GetMyProfileUseCase>(
        "GetMyProfileUseCase"
    ),
    GetUserSessionsUseCase: createToken<GetUserSessionsUseCase>(
        "GetUserSessionsUseCase"
    ),
    RevokeTokenUseCase: createToken<RevokeTokenUseCase>("RevokeTokenUseCase"),
    RevokeAllTokensUseCase: createToken<RevokeAllTokensUseCase>(
        "RevokeAllTokensUseCase"
    ),
} as const;

export function registerAuthDependencies(container: Container): void {
    container.singleton(
        AUTH_TOKENS.BlizzardOauthService,
        () => new BlizzardOauthService()
    );
    container.singleton(AUTH_TOKENS.DiscordApiClient, () => new DiscordApi());

    container.singleton(
        AUTH_TOKENS.AuthRepository,
        (c) => new AuthRepository(c.resolve(DATABASE_TOKENS.SupabaseClient))
    );
    container.singleton(
        AUTH_TOKENS.MemberRepository,
        (c) =>
            new MemberRepository(
                c.resolve(DATABASE_TOKENS.SupabaseClient),
                c.resolve(DATABASE_TOKENS.PostgresSQLClient)
            )
    );
    container.singleton(
        AUTH_TOKENS.RoleRepository,
        (c) => new RoleRepository(c.resolve(DATABASE_TOKENS.SupabaseClient))
    );
    container.singleton(
        AUTH_TOKENS.PermissionRepository,
        (c) =>
            new PermissionRepository(c.resolve(DATABASE_TOKENS.SupabaseClient))
    );
    container.singleton(
        AUTH_TOKENS.BannedRepository,
        (c) => new BannedRepository(c.resolve(DATABASE_TOKENS.SupabaseClient))
    );
    container.singleton(
        AUTH_TOKENS.WowAccountRepository,
        (c) =>
            new WowAccountRepository(c.resolve(DATABASE_TOKENS.SupabaseClient))
    );
    container.singleton(
        AUTH_TOKENS.RealmsRepository,
        (c) => new RealmsRepository(c.resolve(DATABASE_TOKENS.SupabaseClient))
    );

    container.singleton(AUTH_TOKENS.JwtTokenGenerator, () => {
        const { jwtSecret, jwtKid, jwtRefreshSecret } = getEnvironment();
        return new JWTTokenService(jwtSecret, jwtRefreshSecret, jwtKid);
    });
    container.singleton(
        AUTH_TOKENS.EventTrackingService,
        () => new EventTrackingService()
    );
    container.singleton(AUTH_TOKENS.UserContextService, (c) => {
        return new UserContextService(
            c.resolve(AUTH_TOKENS.RoleRepository),
            c.resolve(AUTH_TOKENS.PermissionRepository),
            c.resolve(AUTH_TOKENS.AuthRepository),
            c.resolve(AUTH_TOKENS.BannedRepository),
            c.resolve(AUTH_TOKENS.RealmsRepository),
            c.resolve(AUTH_TOKENS.MemberRepository)
        );
    });

    container.singleton(AUTH_TOKENS.SyncBattlenetMembersToUserUseCase, (c) => {
        const environment = getEnvironment();
        return new SyncBattlenetMembersToUserUsecase(
            c.resolve(AUTH_TOKENS.BlizzardOauthService),
            new WowAccountService(environment.profileNamespaces),
            new WowCharacterService(),
            c.resolve(AUTH_TOKENS.MemberRepository),
            c.resolve(AUTH_TOKENS.WowAccountRepository),
            c.resolve(AUTH_TOKENS.RealmsRepository)
        );
    });
    container.singleton(AUTH_TOKENS.SyncMembersToNewUserUseCase, (c) => {
        return new SyncMembersToNewUserUseCase(
            c.resolve(AUTH_TOKENS.MemberRepository)
        );
    });
    container.singleton(AUTH_TOKENS.AuthenticateWithBattleNetUseCase, (c) => {
        const environment = getEnvironment();
        return new AuthenticateWithBattleNetUseCase(
            c.resolve(AUTH_TOKENS.BlizzardOauthService),
            c.resolve(AUTH_TOKENS.AuthRepository),
            new WowAccountService(environment.profileNamespaces),
            new WowCharacterService(),
            c.resolve(AUTH_TOKENS.MemberRepository),
            c.resolve(AUTH_TOKENS.JwtTokenGenerator),
            c.resolve(AUTH_TOKENS.UserContextService),
            c.resolve(AUTH_TOKENS.WowAccountRepository),
            environment.currentRealms.map((realm) => ({ slug: realm.slug }))
        );
    });
    container.singleton(AUTH_TOKENS.AuthenticateWithDiscordUseCase, (c) => {
        return new AuthenticateWithDiscordUseCase(
            c.resolve(AUTH_TOKENS.AuthRepository),
            c.resolve(AUTH_TOKENS.JwtTokenGenerator),
            c.resolve(AUTH_TOKENS.UserContextService)
        );
    });
    container.singleton(AUTH_TOKENS.LinkOAuthAccountUseCase, (c) => {
        return new LinkOAuthAccountUseCase(
            c.resolve(AUTH_TOKENS.AuthRepository),
            c.resolve(AUTH_TOKENS.SyncBattlenetMembersToUserUseCase),
            c.resolve(AUTH_TOKENS.SyncMembersToNewUserUseCase),
            c.resolve(AUTH_TOKENS.DiscordApiClient),
            c.resolve(AUTH_TOKENS.BlizzardOauthService)
        );
    });
    container.singleton(AUTH_TOKENS.LoginUseCase, (c) => {
        return new LoginUseCase(
            c.resolve(AUTH_TOKENS.AuthenticateWithBattleNetUseCase),
            c.resolve(AUTH_TOKENS.AuthenticateWithDiscordUseCase),
            c.resolve(DATABASE_TOKENS.RedisStore)
        );
    });
    container.singleton(AUTH_TOKENS.RefreshTokenUseCase, (c) => {
        return new RefreshSessionTokenUseCase(
            c.resolve(AUTH_TOKENS.AuthRepository),
            c.resolve(AUTH_TOKENS.JwtTokenGenerator),
            c.resolve(AUTH_TOKENS.UserContextService),
            c.resolve(AUTH_TOKENS.EventTrackingService)
        );
    });
    container.singleton(AUTH_TOKENS.GetSessionUseCase, (c) => {
        return new GetSessionUseCase(
            c.resolve(AUTH_TOKENS.RefreshTokenUseCase),
            c.resolve(DATABASE_TOKENS.RedisStore)
        );
    });
    container.singleton(AUTH_TOKENS.GetMyProfileUseCase, (c) => {
        return new GetMyProfileUseCase(
            c.resolve(AUTH_TOKENS.MemberRepository),
            c.resolve(AUTH_TOKENS.AuthRepository)
        );
    });
    container.singleton(AUTH_TOKENS.GetUserSessionsUseCase, (c) => {
        return new GetUserSessionsUseCase(
            c.resolve(AUTH_TOKENS.AuthRepository)
        );
    });
    container.singleton(AUTH_TOKENS.RevokeTokenUseCase, (c) => {
        return new RevokeTokenUseCase(
            c.resolve(AUTH_TOKENS.AuthRepository),
            c.resolve(AUTH_TOKENS.EventTrackingService)
        );
    });
    container.singleton(AUTH_TOKENS.RevokeAllTokensUseCase, (c) => {
        return new RevokeAllTokensUseCase(
            c.resolve(AUTH_TOKENS.AuthRepository)
        );
    });
}
