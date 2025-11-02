import { ICharacterEquipmentService } from "@repositories/gearscore/i-character-equipment-service.ts";
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
                this.limit(() =>
                    this.equipmentService.fetchEquipment(
                        name.toLowerCase(),
                        realm.toLowerCase(),
                        token.access_token,
                    )
                )
            ),
        );

        // Calculate gear score for each character
        return await Promise.all(
            equipments.map((equipment) =>
                this.calculateForCharacter(
                    equipment,
                    token.access_token,
                    request.forceRefresh || false,
                )
            ),
        );
    }

    private async calculateForCharacter(
        equipment: { characterName: string; equippedItems: any[] },
        token: string,
        forceRefresh: boolean,
    ): Promise<GearScore> {
        const rawItems = equipment.equippedItems.map((item) => ({
            id: item.itemId,
            type: item.inventoryType,
            isEnchanted: item.isEnchanted,
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

        // Fetch item details and calculate
        const completeItems = await Promise.all(
            rawItems.map(async (item) =>
                this.limit(async () => {
                    const details = await this.itemService.getItem(
                        item.id,
                        token,
                        true,
                    );

                    // Map quality string to enum
                    const qualityType = details.quality.type.toUpperCase();
                    const quality =
                        ItemQuality[qualityType as keyof typeof ItemQuality] ||
                        ItemQuality.COMMON;

                    return createEquippedItem(
                        item.id,
                        item.type as InventoryType,
                        item.isEnchanted,
                        details.itemLevel,
                        quality,
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

        // Calculate gear score
        const score = this.calculator.calculateTotalGearScore(validItems);
        const color = this.calculator.getColorForGearScore(score);

        // Save to cache
        await this.cacheRepository.save(hash, score, color);

        return createGearScore(
            equipment.characterName,
            score,
            color,
            hash,
            isFullEnchanted,
        );
    }
}
