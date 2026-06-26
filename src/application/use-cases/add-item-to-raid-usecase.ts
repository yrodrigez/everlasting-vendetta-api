import type { IWoWHeadService } from "src/domain/services/i-wow-head-service";
import type { IRaidLootRepository } from "@repositories/i-raid-loot-repository";
import { createLogger } from "src/infrastructure/logging/index.ts";

export interface AddItemToRaidInput {
    itemId: number;
    bossName?: string;
    raidId: string;
}

export interface AddItemToRaidOutput {
    item: {
        id: number;
        name: string;
    };
    boss:
        | {
              id: string;
              name: string;
          }
        | undefined;
    raidId: string;
}

export class AddItemToRaidUseCase {
    private readonly logger = createLogger("AddItemToRaidUseCase");

    constructor(
        private readonly wowHeadService: IWoWHeadService,
        private readonly raidLootRepository: IRaidLootRepository
    ) {}

    async execute(input: AddItemToRaidInput): Promise<AddItemToRaidOutput> {
        const { itemId, bossName, raidId } = input;

        this.logger.info("Fetching item details from WoWHead", { itemId });
        const itemDetails = await this.wowHeadService.fetchItemDetails(itemId);

        await this.raidLootRepository.upsertItem({
            id: itemId,
            name: itemDetails.name,
            description: {
                icon: itemDetails.icon,
                icons: itemDetails.icons,
                tooltip: itemDetails.tooltip,
                quality: itemDetails.quality,
                qualityName: itemDetails.qualityName,
                level: itemDetails.level,
                type: itemDetails.type,
                spells: itemDetails.spells,
            },
        });

        await this.raidLootRepository.linkItemToRaid(itemId, raidId);
        let boss;
        if (bossName) {
            boss = await this.raidLootRepository.upsertBoss(bossName);
            await this.raidLootRepository.linkItemToBoss(itemId, boss.id);
            this.logger.info("Item linked to boss successfully", {
                itemId,
                bossName,
                raidId,
            });
        }

        this.logger.info("Item added to raid successfully", {
            itemId,
            bossName,
            raidId,
        });

        return {
            item: { id: itemId, name: itemDetails.name },
            boss:
                bossName && boss ? { id: boss.id, name: boss.name } : undefined,
            raidId,
        };
    }
}
