import type { CharacterEquipment } from "@repositories/gearscore/i-character-equipment-service";
import type { IGearScoreCacheRepository } from "@repositories/gearscore/i-gearscore-cache-repository";
import type { IItemService } from "@repositories/gearscore/i-item-service";
import {
    createEquippedItem,
    type EquippedItem,
} from "@entities/gearscore/equipped-item";
import {
    createGearScore,
    type GearScore,
} from "@entities/gearscore/gear-score";
import type { InventoryType } from "@entities/gearscore/inventory-type";
import { ItemQuality } from "@entities/gearscore/item-quality";
import type {
    HighestGS,
    HighestGSPort,
} from "../../ports/gear-score/highest-gs.port";
import { GearScoreCalculator } from "../../../infrastructure/services/gear-score-calculator";
import { isFullyEnchanted } from "./gearscore-enchantment";
import { calculateIsFullyGemmed } from "./gear-score-gems";

export type GearScoreResolverInput = {
    readonly characterName: string;
    readonly realmSlug: string;
    readonly characterClass?: string;
    readonly equippedItems: CharacterEquipment["equippedItems"];
    readonly forceRefresh?: boolean;
};

type RawGearScoreItem = {
    id: number;
    type: string;
    isEnchanted: boolean;
    qualityType: string;
    fetchUrl?: string;
    gems: CharacterEquipment["equippedItems"][number]["gems"];
};

export class GearScoreResolver {
    private readonly calculator = new GearScoreCalculator();

    constructor(
        private readonly cacheRepository: IGearScoreCacheRepository,
        private readonly itemService: IItemService,
        private readonly highestGSPort: HighestGSPort
    ) {}

    async resolve(input: GearScoreResolverInput): Promise<GearScore> {
        const rawItems = this.getRawItems(input.equippedItems);
        const isFullEnchanted = isFullyEnchanted(
            rawItems.map((item) => ({
                inventoryType: item.type,
                isEnchanted: item.isEnchanted,
            }))
        );

        const withSocketsAndGems = input.equippedItems.filter(
            (item) =>
                item.gems &&
                item.gems.length > 0 &&
                item.sockets &&
                item.sockets.length > 0 &&
                item.gems.length === item.sockets.length
        );
        const withoutSockets = input.equippedItems.filter(
            (item) =>
                !item.sockets ||
                !item.gems ||
                (item.gems ?? []).length !== (item.sockets ?? []).length
        );
        const updatedItems = await Promise.all(
            withoutSockets.map(async (item) => {
                const details = await this.itemService.getItem(item.itemId);
                return {
                    ...item,
                    ...details,
                };
            })
        );
        const allItems = [...withSocketsAndGems, ...updatedItems];
        const isFullyGemmed = calculateIsFullyGemmed(allItems);
        const currentGearScore = await this.resolveCurrentGearScore(
            input,
            rawItems,
            isFullEnchanted,
            isFullyGemmed
        );

        const highestGS = await this.highestGSPort.getHighestGS(
            input.characterName,
            input.realmSlug,
            input.forceRefresh
        );

        if (
            highestGS &&
            highestGS.details.gs > currentGearScore.score &&
            !input.forceRefresh &&
            highestGS.details.isFullEnchanted &&
            highestGS.details.isFullyGemmed
        ) {
            return this.createGearScoreFromHighest(highestGS);
        }

        await this.highestGSPort.saveHighestGS({
            characterName: this.normalize(input.characterName),
            realmSlug: this.normalize(input.realmSlug),
            createdAt: new Date(),
            updatedAt: new Date(),
            details: {
                gs: currentGearScore.score,
                hash: currentGearScore.hash,
                color: currentGearScore.color,
                isFullEnchanted: currentGearScore.isFullEnchanted,
                isFullyGemmed: currentGearScore.isFullyGemmed,
            },
        });

        return currentGearScore;
    }

    private async resolveCurrentGearScore(
        input: GearScoreResolverInput,
        rawItems: RawGearScoreItem[],
        isFullEnchanted: boolean,
        isFullyGemmed: boolean
    ): Promise<GearScore> {
        const forceRefresh = input.forceRefresh ?? false;
        const hash = await this.calculator.createEquipmentHash(
            rawItems.sort((a, b) => a.id - b.id)
        );
        const cachedScore = await this.cacheRepository.getByHash(hash);

        if (cachedScore && !forceRefresh && cachedScore.score !== 0) {
            return createGearScore(
                input.characterName,
                cachedScore.score,
                cachedScore.color,
                hash,
                isFullEnchanted,
                isFullyGemmed
            );
        }

        const completeItems = await Promise.all(
            rawItems.map(async (item) => {
                const details = await this.itemService.getItem(
                    item.id,
                    forceRefresh
                );
                const apiQuality =
                    ItemQuality[item.qualityType as keyof typeof ItemQuality];
                const wowheadQuality =
                    ItemQuality[
                        details.quality.type.toUpperCase() as keyof typeof ItemQuality
                    ];
                const quality =
                    apiQuality ?? wowheadQuality ?? ItemQuality.COMMON;

                return createEquippedItem(
                    item.id,
                    item.type as InventoryType,
                    item.isEnchanted,
                    details.itemLevel,
                    quality,
                    item.gems || [],
                    details.sockets ?? []
                );
            })
        );
        const validItems = completeItems.filter(
            (item: EquippedItem) =>
                item &&
                item.itemLevel > 0 &&
                item.inventoryType.startsWith("INVTYPE_")
        );
        const score = this.calculator.calculateTotalGearScore(
            validItems,
            input.characterClass
        );
        const color = this.calculator.getColorForGearScore(score);
        const isFullyGemmedCalculated = calculateIsFullyGemmed(validItems);
        if (score === 0 && cachedScore) {
            return createGearScore(
                input.characterName,
                cachedScore.score,
                cachedScore.color,
                hash,
                isFullEnchanted,
                isFullyGemmedCalculated
            );
        }

        if (score < (cachedScore?.score ?? 0) && cachedScore && !forceRefresh) {
            return createGearScore(
                input.characterName,
                cachedScore.score,
                cachedScore.color,
                hash,
                isFullEnchanted,
                isFullyGemmedCalculated
            );
        }

        await this.cacheRepository.save(
            hash,
            score,
            color,
            isFullyGemmedCalculated
        );

        return createGearScore(
            input.characterName,
            score,
            color,
            hash,
            isFullEnchanted,
            isFullyGemmedCalculated
        );
    }

    private getRawItems(
        equippedItems: CharacterEquipment["equippedItems"]
    ): RawGearScoreItem[] {
        return equippedItems
            .filter(
                (item) =>
                    item.inventoryType.toLowerCase().indexOf("tabard") === -1
            )
            .map((item) => ({
                id: item.itemId,
                type: item.inventoryType,
                isEnchanted: item.isEnchanted,
                qualityType: item.qualityType,
                fetchUrl: item.fetchUrl?.toString(),
                gems: item.gems,
            }));
    }

    private createGearScoreFromHighest(highestGS: HighestGS): GearScore {
        return createGearScore(
            highestGS.characterName,
            highestGS.details.gs,
            highestGS.details.color,
            highestGS.details.hash,
            highestGS.details.isFullEnchanted,
            highestGS.details.isFullyGemmed
        );
    }

    private normalize(value: string): string {
        return value.trim().toLowerCase();
    }
}
