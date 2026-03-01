import type { IRaidLootRepository, Raid } from "@repositories/i-raid-loot-repository";

export class GetRaidsUseCase {
    constructor(private readonly raidLootRepository: IRaidLootRepository) {}

    async execute(): Promise<Raid[]> {
        return await this.raidLootRepository.getRaids();
    }
}
