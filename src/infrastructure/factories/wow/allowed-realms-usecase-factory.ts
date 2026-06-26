import { DatabaseClientFactory } from "@database/database-client-factory";
import { RealmsRepository } from "@infrastructure/repositories/realms-repository";
import { GetAllowedRealms } from "@use-cases/get-allowed-realms";

export class GetAllowedRealmsUseCaseFactory {
    static make() {
        const databaseClient = DatabaseClientFactory.getInstance();
        const repository = new RealmsRepository(databaseClient);

        return new GetAllowedRealms(repository);
    }
}
