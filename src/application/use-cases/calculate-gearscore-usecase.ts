import { CharacterEquipment, ICharacterEquipmentService } from "@repositories/gearscore/i-character-equipment-service.ts";
import { IGearScoreCacheRepository } from "@repositories/gearscore/i-gearscore-cache-repository.ts";
import { IItemService } from "@repositories/gearscore/i-item-service.ts";
import ITokenRepository from "@repositories/i-token-repository.ts";
import pLimit from "p-limit";
import { createLogger } from "src/infrastructure/logging/index.ts";
import { GearScoreCalculator } from "src/infrastructure/services/gear-score-calculator.ts";
import {
    createEquippedItem,
    type EquippedItem,
} from "../../domain/entities/gearscore/equipped-item.ts";
import {
    createGearScore,
    type GearScore,
} from "../../domain/entities/gearscore/gear-score.ts";
import type { InventoryType } from "../../domain/entities/gearscore/inventory-type.ts";
import { isEnchantable } from "../../domain/entities/gearscore/inventory-type.ts";
import { ItemQuality } from "../../domain/entities/gearscore/item-quality.ts";

export interface CalculateGearScoreRequest {
    characters: { name: string; realm: string }[];
    forceRefresh?: boolean;
}

export class CalculateGearScoreUseCase {
    private readonly logger = createLogger("CalculateGearScoreUseCase");
    private readonly calculator = new GearScoreCalculator();
    private readonly limit = pLimit(8);

    constructor(
        private readonly tokenRepository: ITokenRepository,
        private readonly cacheRepository: IGearScoreCacheRepository,
        private readonly equipmentService: ICharacterEquipmentService,
        private readonly itemService: IItemService,
    ) { }

    async execute(
        request: CalculateGearScoreRequest,
    ): Promise<GearScore[]> {
        // Get Blizzard token
        const token = await this.tokenRepository.getCurrentToken();

        // Fetch equipment for all characters
        const equipments = await Promise.all(
            request.characters.map(({ name, realm }) =>
                this.limit(async () => {
                    const data = await this.equipmentService.fetchEquipment(
                        name.toLowerCase(),
                        realm.toLowerCase(),
                        token.access_token,
                    )

                    const equippedItems = data.equippedItems.filter(item => item.inventoryType.toLocaleLowerCase().indexOf('tabard') === -1);
                    return { ...data, equippedItems };
                })
            ),
        );

        // Calculate gear score for each character
        return await Promise.all(
            equipments.map((equipment) =>
                this.calculateForCharacter(
                    equipment,
                    request.forceRefresh || false,
                )
            ),
        );
    }

    private async calculateForCharacter(
        equipment: { characterName: string; characterClass?: string; equippedItems: CharacterEquipment['equippedItems'] },
        forceRefresh: boolean,
    ): Promise<GearScore> {
        const rawItems = equipment.equippedItems.map((item) => ({
            id: item.itemId,
            type: item.inventoryType,
            isEnchanted: item.isEnchanted,
            qualityType: item.qualityType,
            fetchUrl: item.fetchUrl?.toString(),
            gems: item.gems,
        }));

        // Check if character is fully enchanted
        const isFullEnchanted = rawItems
            .filter(({ type }) => isEnchantable(type as InventoryType))
            .filter(({ type }) => !type.includes("RANGED"))
            .every((item) => item.isEnchanted);

        // Create hash for caching
        const hash = await this.calculator.createEquipmentHash(
            rawItems.sort((a, b) => a.id - b.id),
        );

        // Check cache
        const cachedScore = await this.cacheRepository.getByHash(hash);
        this.logger.info(`character: ${equipment.characterName}, hash: ${hash}, cachedScore: ${cachedScore ? cachedScore.score : 'none'}`);
        if (cachedScore && !forceRefresh && cachedScore.score !== 0) {
            this.logger.info(`Using cached gear score for character: ${equipment.characterName}, score: ${cachedScore.score}`);
            return createGearScore(
                equipment.characterName,
                cachedScore.score,
                cachedScore.color,
                hash,
                isFullEnchanted,
            );
        }

        this.logger.info(`NOT CACHED: Calculating gear score for character: ${equipment.characterName}`);

        // Fetch item details from WoWHead (Classic TBC API doesn't include item level)
        const completeItems = await Promise.all(
            rawItems.map(async (item) =>
                this.limit(async () => {
                    const details = await this.itemService.getItem(
                        item.id,
                        forceRefresh || (1769455333245 + 1000 * 60 * 24 * 30 > Date.now()),
                    );

                    // Use quality from Blizzard API (more reliable), fall back to WoWHead
                    const apiQuality = ItemQuality[item.qualityType as keyof typeof ItemQuality];
                    const wowheadQuality = ItemQuality[details.quality.type.toUpperCase() as keyof typeof ItemQuality];
                    const quality = apiQuality ?? wowheadQuality ?? ItemQuality.COMMON;

                    return createEquippedItem(
                        item.id,
                        item.type as InventoryType,
                        item.isEnchanted,
                        details.itemLevel,
                        quality,
                        item.gems || [],
                    );
                })
            ),
        );

        // Filter valid items
        const validItems = completeItems.filter(
            (item: EquippedItem) =>
                item &&
                item.itemLevel > 0 &&
                item.inventoryType.startsWith("INVTYPE_"),
        );

        // DEBUG: log each item's score breakdown
        for (const item of validItems) {
            const itemScore = this.calculator.calculateItemScore(item, equipment.characterClass);
            this.logger.info(`[DEBUG] ${item.inventoryType} id=${item.id} ilvl=${item.itemLevel} quality=${item.quality} enchanted=${item.isEnchanted} gems=${item.gems?.length ?? 0} => score=${itemScore}`);
        }

        // Calculate gear score with class token for class-specific adjustments (e.g. Hunter)
        const score = this.calculator.calculateTotalGearScore(validItems, equipment.characterClass);
        const color = this.calculator.getColorForGearScore(score);

        // Save to cache
        //await this.cacheRepository.save(hash, score, color);

        return createGearScore(
            equipment.characterName,
            score,
            color,
            hash,
            isFullEnchanted,
        );
    }
}
