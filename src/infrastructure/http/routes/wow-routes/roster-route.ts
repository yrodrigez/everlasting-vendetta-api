import { Hono } from "hono";
import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { DatabaseClientFactory } from "@database/database-client-factory";
import { MemberRepository } from "src/infrastructure/repositories/member-repository";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { BlizzardTokenRepository } from "src/infrastructure/repositories/blizzard-token-repository";
import { WowGuildService } from "@external/wow-guild-service";
import { WowCharacterService } from "@external/wow-character-service";
import { GetGuildRosterUseCase } from "@use-cases/get-guild-roster-usecase";
import { ResponseMapper } from "@utils/map-error";

const rosterRouter = new Hono();

rosterRouter.get(
    "/",
    authMiddleware,
    createRoute(
        {
            functionName: "wow-roster",
        },
        async ({ logger }) => {
            const databaseClient = DatabaseClientFactory.getInstance();
            const memberRepository = new MemberRepository(databaseClient);
            const blizzardOauthService = new BlizzardOauthService();
            const tokenRepository = new BlizzardTokenRepository(
                databaseClient,
                blizzardOauthService,
            );

            const token = await tokenRepository.getCurrentToken();

            const wowGuildService = new WowGuildService(token.access_token);
            const wowCharacterService = new WowCharacterService(
                token.access_token,
            );

            const useCase = new GetGuildRosterUseCase(
                wowGuildService,
                memberRepository,
                wowCharacterService,
            );

            logger.info("Fetching guild roster for authenticated request");
            const data = await useCase.execute();
            logger.info(
                `Fetched guild roster with ${data.length} characters`,
            );

            return {
                roster: data,
                count: data.length,
            };
        },
    ),
);

export default rosterRouter;

