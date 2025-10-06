import { Hono } from "hono";
import { createRoute } from "@http/hono-adapter";
import { wowProfileCharactersSchema, WowProfileCharactersInput } from "@http/validators/schemas/wow-routes-schemas";
import WowAccountService from "@external/wow-account-service";
import { WowCharacterService } from "@external/wow-character-service";
import { GetRealmCharactersUseCase } from "@use-cases/get-realm-characters-usecase";
import GetFullCharactersUseCase from "@use-cases/get-full-characters-usecase";
import { DatabaseClientFactory } from "@database/database-client-factory";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { WowAccountRepository } from "src/infrastructure/repositories/wow-account-repository";
import { MemberRepository } from "src/infrastructure/repositories/member-repository";
import { SaveWowAccountUseCase } from "@use-cases/save-wow-account-usecase";
import { SyncWowAccountCharactersUsecase } from "@use-cases/sync-wow-account-characters-usecase";
import { GetUserOauthToken } from "@use-cases/get-user-oauth-token";
import { AuthRepository } from "src/infrastructure/repositories/auth-repository";
import { JWTTokenService } from "src/infrastructure/security/jwt-token-service";
import { getEnvironment } from "src/infrastructure/environment";

const wowRoutes = new Hono();

wowRoutes.post(createRoute<WowProfileCharactersInput>(
    {
        functionName: "profile-characters",
        inputSchema: wowProfileCharactersSchema,
    },
    async ({ input: { access_token, realmSlug } }) => {
        const databaseClient = DatabaseClientFactory.getInstance();
        const blizzardOauthService = new BlizzardOauthService();
        const wowAccountRepository = new WowAccountRepository(databaseClient);
        const memberRepository = new MemberRepository(databaseClient);

        const saveWowAccountUseCase = new SaveWowAccountUseCase(
            wowAccountRepository,
            blizzardOauthService
        );
        const syncWowAccountCharactersUseCase = new SyncWowAccountCharactersUsecase(
            memberRepository
        );

        const authRepository = new AuthRepository(databaseClient);
        const { jwtKid, jwtSecret } = getEnvironment()
        const tokenService = new JWTTokenService(jwtSecret, jwtSecret, jwtKid);
        const getUserToken = new GetUserOauthToken(
            authRepository,
            tokenService
        );

        const bnetToken = await getUserToken.execute(access_token);
        if (!bnetToken) {
            throw new Error("Invalid or expired access token");
        }
        // Create token-specific services
        const wowAccountService = new WowAccountService(bnetToken);
        const wowCharacterService = new WowCharacterService(bnetToken);

        const getRealmCharactersUseCase = new GetRealmCharactersUseCase(
            wowAccountService,
            { realm: realmSlug }
        );
        const getFullCharactersUseCase = new GetFullCharactersUseCase(
            wowCharacterService
        );

        // Orchestrate use cases
        const accountId = await saveWowAccountUseCase.execute(bnetToken);

        const accountCharacters = await getRealmCharactersUseCase.execute();

        const eligibleCharacters = accountCharacters
            .filter((char) => char.level >= 10)
            .map((char) => ({
                name: char.name,
                realmSlug: char.realm.slug,
                level: char.level,
            }));

        const characters = await getFullCharactersUseCase.execute(eligibleCharacters);

        await syncWowAccountCharactersUseCase.execute(
            characters,
            accountId,
            "bnet_oauth"
        );

        return {
            success: true,
            data: characters,
        };
    }
));

export default wowRoutes;
