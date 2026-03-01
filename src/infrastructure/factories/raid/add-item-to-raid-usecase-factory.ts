import { DatabaseClientFactory } from "@database/database-client-factory";
import { WoWHeadService } from "@external/wow-head-service";
import { AddItemToRaidUseCase } from "@use-cases/add-item-to-raid-usecase";
import { RaidLootRepository } from "src/infrastructure/repositories/raid-loot-repository";

export class AddItemToRaidUseCaseFactory {
    static make(): AddItemToRaidUseCase {
        const databaseClient = DatabaseClientFactory.getInstance();
        const raidLootRepository = new RaidLootRepository(databaseClient);
        const wowHeadService = new WoWHeadService();

        return new AddItemToRaidUseCase(wowHeadService, raidLootRepository);
    }
}
