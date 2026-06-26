import { Realm } from "@dto/realms";
import { IRealmsRepository } from "@repositories/i-realms-repository";

export class GetAllowedRealms {
    constructor(private realmsRepository: IRealmsRepository) {}
    async execute(): Promise<Realm[]> {
        const realms = await this.realmsRepository.getAllowedRealms();
        return realms;
    }
}
