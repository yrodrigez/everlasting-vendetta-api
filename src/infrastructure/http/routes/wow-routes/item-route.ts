import { Hono } from "hono";
import { createRoute } from "@http/hono-adapter";
import {
    WowItemParams,
    wowItemParamsSchema,
    wowItemQuerySchema,
    type WowItemQuery,
} from "@http/validators/schemas/wow-routes-schemas";
import { DatabaseClientFactory } from "@database/database-client-factory";
import { BlizzardTokenRepository } from "src/infrastructure/repositories/blizzard-token-repository";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { WowItemCacheRepository } from "src/infrastructure/repositories/wow-item-cache-repository";
import { WoWHeadService } from "@external/wow-head-service";
import { BlizzardItemService } from "@external/blizzard-item-service";
import {
    GetWowItemDetailsUseCase,
    type GetWowItemDetailsOutput,
} from "@use-cases/get-wow-item-details-usecase";

const wowItemRouter = new Hono();

wowItemRouter.get(
    "/:itemId",
    createRoute<unknown, GetWowItemDetailsOutput, WowItemQuery, WowItemParams>(
        {
            functionName: "wow-item",
            querySchema: wowItemQuerySchema,
            paramsSchema: wowItemParamsSchema,
        },
        async ({ query, params }) => {
            const itemId = params.itemId;
            if (!Number.isFinite(itemId) || itemId <= 0) {
                throw new Error(
                    "Invalid itemId parameter provided: " + itemId,
                );
            }

            if (itemId === 999999) {
                return {
                    itemIconUrl: "https://wow.zamimg.com/images/wow/icons/medium/inventoryslot_empty.jpg",
                    itemDetails: {
                        id: itemId,
                        name: "Unknown Item",
                        tooltip: "",
                        icon: "https://wow.zamimg.com/images/wow/icons/medium/inventoryslot_empty.jpg",
                        icons: {
                            small: "https://wow.zamimg.com/images/wow/icons/small/inventoryslot_empty.jpg",
                            medium: "https://wow.zamimg.com/images/wow/icons/medium/inventoryslot_empty.jpg",
                            large: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_empty.jpg",
                        },
                        level: 0,
                        quality: {
                            type: "UNKNOWN",
                            name: "Unknown",
                        },
                        type: "Unknown",
                        spells: [],
                        qualityName: "unknown",
                    },
                    displayId: null,
                };
            }

            const forceRefresh = normalizeForceFlag(query.force);

            const databaseClient = DatabaseClientFactory.getInstance();
            const cacheRepository = new WowItemCacheRepository(databaseClient);
            const wowHeadService = new WoWHeadService();
            const blizzardItemService = new BlizzardItemService();
            const tokenRepository = new BlizzardTokenRepository(
                databaseClient,
                new BlizzardOauthService(),
            );

            const useCase = new GetWowItemDetailsUseCase(
                cacheRepository,
                wowHeadService,
                blizzardItemService,
                tokenRepository,
            );

            return useCase.execute({
                itemId,
                forceRefresh,
            });
        },
    ),
);

function normalizeForceFlag(value?: string | null): boolean {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
}

export default wowItemRouter;
