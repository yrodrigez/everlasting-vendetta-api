import { DatabaseClientFactory } from "@database/database-client-factory";
import { GetRaidsUseCase } from "@use-cases/get-raids-usecase";
import { RaidLootRepository } from "src/infrastructure/repositories/raid-loot-repository";

export class GetRaidsUseCaseFactory {
    static make(): GetRaidsUseCase {
        const databaseClient = DatabaseClientFactory.getInstance();
        const raidLootRepository = new RaidLootRepository(databaseClient);

        return new GetRaidsUseCase(raidLootRepository);
    }
}
