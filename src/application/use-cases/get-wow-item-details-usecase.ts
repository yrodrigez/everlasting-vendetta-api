import type { IWowItemCacheRepository } from "src/domain/repositories/i-wow-item-cache-repository";
import type { IWoWHeadService } from "src/domain/services/i-wow-head-service";
import type { IBlizzardItemService } from "src/domain/services/i-blizzard-item-service";
import type ITokenRepository from "src/domain/repositories/i-token-repository";
import type { WowItemDetails } from "src/domain/entities/wow/wow-item-details";

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 60; // 60 days

const KNOWN_ITEM_LEVELS: Record<number, number> = {
    215161: 45,
    210781: 30,
    211450: 33,
    215111: 45,
    999999: 0,
    0: 0,
    216494: 45,
    213409: 45,
    213350: 45,
};

export interface GetWowItemDetailsInput {
    itemId: number;
    forceRefresh?: boolean;
}

export interface GetWowItemDetailsOutput {
    itemIconUrl: string | null;
    itemDetails: WowItemDetails;
    displayId: number | null;
}

export class GetWowItemDetailsUseCase {
    constructor(
        private readonly cacheRepository: IWowItemCacheRepository,
        private readonly wowHeadService: IWoWHeadService,
        private readonly blizzardItemService: IBlizzardItemService,
        private readonly tokenRepository: ITokenRepository,
    ) { }

    async execute(input: GetWowItemDetailsInput): Promise<GetWowItemDetailsOutput> {
        const { itemId, forceRefresh } = input;

        const cached = await this.cacheRepository.get(itemId);

        if (!forceRefresh && cached && !this.isCacheStale(cached.updatedAt)) {
            return {
                itemIconUrl: cached.details.icon,
                itemDetails: cached.details,
                displayId: cached.displayId,
            };
        }

        const [wowHeadData, token] = await Promise.all([
            this.wowHeadService.fetchItemDetails(itemId),
            this.tokenRepository.getCurrentToken(),
        ]);

        const blizzardDetails = await this.tryFetchBlizzardDetails(
            token.access_token,
            itemId,
        );

        const level = this.resolveItemLevel(itemId, wowHeadData.level, blizzardDetails.itemLevel);

        const quality = blizzardDetails.quality ?? {
            type: wowHeadData.qualityName.toUpperCase(),
            name: wowHeadData.qualityName.charAt(0).toUpperCase() + wowHeadData.qualityName.slice(1),
        };

        const mergedDetails: WowItemDetails = {
            id: wowHeadData.id,
            name: wowHeadData.name,
            tooltip: wowHeadData.tooltip,
            icon: wowHeadData.icon,
            icons: wowHeadData.icons,
            level,
            quality,
            type: wowHeadData.type,
            spells: wowHeadData.spells,
            qualityName: wowHeadData.qualityName,
        };

        const displayId = cached?.displayId ?? null;

        await this.cacheRepository.save(itemId, mergedDetails, displayId);

        return {
            itemIconUrl: mergedDetails.icon,
            itemDetails: mergedDetails,
            displayId,
        };
    }

    private isCacheStale(updatedAt: Date): boolean {
        return Date.now() - updatedAt.getTime() > CACHE_TTL_MS;
    }

    private async tryFetchBlizzardDetails(token: string, itemId: number) {
        try {
            return await this.blizzardItemService.fetchItemDetails(token, itemId);
        } catch (error) {
            console.error("GetWowItemDetailsUseCase::tryFetchBlizzardDetails - error", {
                itemId,
                error,
            });

            const knownLevel = KNOWN_ITEM_LEVELS[itemId] ?? 0;
            return {
                itemLevel: knownLevel,
                quality: {
                    type: knownLevel > 0 ? "COMMON" : "UNKNOWN",
                    name: knownLevel > 0 ? "Common" : "Unknown",
                },
            };
        }
    }

    private resolveItemLevel(itemId: number, wowHeadLevel: number, blizzardLevel: number) {
        if (blizzardLevel && blizzardLevel > 0) {
            return blizzardLevel;
        }

        if (wowHeadLevel && wowHeadLevel > 0) {
            return wowHeadLevel;
        }

        return KNOWN_ITEM_LEVELS[itemId] ?? 0;
    }
}
