import { Provider } from "@dto/auth/provider";
import { IAuthRepository } from "@repositories/i-auth-repository";
import { IBannedRepository } from "@repositories/i-banned-repository";
import { IPermissionRepository } from "@repositories/i-permission-repository";
import { IRoleRepository } from "@repositories/i-role-repository";
import { IUserContextService, UserContext } from "./i-user-context-service";
import { IRealmsRepository } from "@repositories/i-realms-repository";
import { IMemberRepository } from "@repositories/i-member-repository";

const GUILD_NAMES = ["Everlasting Vendetta"];

export class UserContextService implements IUserContextService {
    private static readonly REFRESH_GRACE_PERIOD_MS = 5 * 60 * 1000;

    constructor(
        private readonly rolesRepository: IRoleRepository,
        private readonly permissionsRepository: IPermissionRepository,
        private readonly authRepository: IAuthRepository,
        private readonly bansRepository: IBannedRepository,
        private readonly realmsRepository: IRealmsRepository,
        private readonly memberRepository: IMemberRepository
    ) {}

    async getUserContext(
        userId: string,
        provider?: Provider
    ): Promise<UserContext> {
        // Fetch all user context data in parallel for performance
        const [roles, isBanned, oauthProvider, realms] = await Promise.all([
            this.rolesRepository.findByMemberId(userId),
            this.bansRepository.isUserBanned(userId),
            provider
                ? this.authRepository.getOauthProvider(userId, provider)
                : Promise.resolve(null),
            this.realmsRepository.getAllowedRealms(),
        ]);

        const permissions = await this.permissionsRepository.findByRoles(roles);

        const characters = (
            await this.memberRepository.findAllByUserId(userId)
        ).map((m) => m.character);
        const isGuildMember = characters.some(
            (char) =>
                char.guild &&
                GUILD_NAMES.includes(char.guild.name) &&
                realms.some((realm) => realm.id === char.realm.id)
        );

        const shouldRefreshProviderToken = oauthProvider
            ? this.shouldRefreshToken(oauthProvider.expiresAt)
            : false;

        return {
            userId,
            roles,
            permissions,
            isBanned,
            isAdmin: roles.includes("ADMIN"),
            oauthProvider: oauthProvider
                ? {
                      provider: oauthProvider.provider as Provider,
                      expiresAt: oauthProvider.expiresAt,
                      accessToken: oauthProvider.accessToken,
                      refreshToken: oauthProvider.refreshToken,
                  }
                : null,
            isGuildMember,
            shouldRefreshProviderToken,
        };
    }

    /**
     * Determines if an OAuth token should be refreshed based on its expiration time
     * Returns true if the token expires within the grace period
     */
    private shouldRefreshToken(expiresAt: Date): boolean {
        const expirationTime = new Date(expiresAt).getTime();
        const now = Date.now();
        const gracePeriodThreshold =
            now + UserContextService.REFRESH_GRACE_PERIOD_MS;

        return expirationTime < gracePeriodThreshold;
    }
}
