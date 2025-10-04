import { Hono } from "hono";
import { createRoute } from "@http/hono-adapter";
import { wowProfileCharactersSchema } from "@http/validators/wow-routes-validators";
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

const wowRoutes = new Hono();

wowRoutes.post(createRoute(
    {
        functionName: "profile-characters",
        inputSchema: wowProfileCharactersSchema,
    },
    async ({ input: { access_token: bnetToken, realmSlug }, logger }) => {
        // Simple dependency composition - initialize only what we need
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
