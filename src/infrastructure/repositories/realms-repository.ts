import { DatabaseClient } from "@database/database-client-factory";
import { Realm } from "@entities/wow/wow-character";
import { ServiceError } from "@errors/service-error";
import { createLogger } from "@infrastructure/logging";
import { IRealmsRepository } from "@repositories/i-realms-repository";

export class RealmsRepository implements IRealmsRepository {
    constructor(private readonly database: DatabaseClient, private readonly logger = createLogger("RealmsRepository")) { }
    async getAllowedRealms(): Promise<Realm[]> {
        this.logger.info("Fetching allowed realms from database");
        const { data, error } = await this.database
            .from("realms")
            .select("id, name, slug")

        if (error) {
            throw new ServiceError({ message: error.message, serviceName: "RealmsRepository" });
        }

        return data || [];
    }
}