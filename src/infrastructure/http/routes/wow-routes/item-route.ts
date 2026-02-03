import { DatabaseClientFactory } from "@database/database-client-factory";
import { BlizzardOauthService } from "@external/blizzard-oauth-service";
import { ItemService } from "@external/item-service";
import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import {
    WowItemParams,
    wowItemParamsSchema,
    wowItemQuerySchema,
    type WowItemQuery,
} from "@http/validators/schemas/wow-routes-schemas";
import {
    GetWowItemDetailsUseCase,
    type GetWowItemDetailsOutput,
} from "@use-cases/get-wow-item-details-usecase";
import { Hono } from "hono";
import { BlizzardTokenRepository } from "src/infrastructure/repositories/blizzard-token-repository";

const wowItemRouter = new Hono();

wowItemRouter.get(
    "/:itemId",
    authMiddleware,
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
            const itemService = new ItemService(databaseClient);
            const tokenRepository = new BlizzardTokenRepository(
                databaseClient,
                new BlizzardOauthService(),
            );

            const useCase = new GetWowItemDetailsUseCase(
                itemService,
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
