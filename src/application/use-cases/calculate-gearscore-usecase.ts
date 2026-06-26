import { ICharacterEquipmentService } from "@repositories/gearscore/i-character-equipment-service.ts";
import ITokenRepository from "@repositories/i-token-repository.ts";
import pLimit from "p-limit";
import { type GearScore } from "../../domain/entities/gearscore/gear-score.ts";
import { GearScoreResolver } from "../services/gear-score/gear-score-resolver.ts";
import { createLogger } from "@infrastructure/logging/index.ts";

export interface CalculateGearScoreRequest {
    characters: { name: string; realm: string }[];
    forceRefresh?: boolean;
}

export class CalculateGearScoreUseCase {
    private readonly limit = pLimit(8);
    private readonly logger = createLogger("CalculateGearScoreUseCase");

    constructor(
        private readonly tokenRepository: ITokenRepository,
        private readonly equipmentService: ICharacterEquipmentService,
        private readonly gearScoreResolver: GearScoreResolver
    ) {}

    async execute(request: CalculateGearScoreRequest): Promise<GearScore[]> {
        // Get Blizzard token
        this.logger.info("Fetching Blizzard token...");
        const token = await this.tokenRepository.getCurrentToken();
        this.logger.info("Blizzard token fetched successfully.");

        this.logger.info(
            `Fetching equipment for ${request.characters.length} characters...`
        );
        const equipments = await Promise.all(
            request.characters.map(({ name, realm }) =>
                this.limit(async () => {
                    try {
                        const data = await this.equipmentService.fetchEquipment(
                            name.toLowerCase(),
                            realm.toLowerCase(),
                            token.access_token
                        );

                        return { realmSlug: realm, equipment: data };
                    } catch (error) {
                        this.logger.error(
                            `Error fetching equipment for ${name} on ${realm}:`,
                            error instanceof Error ? error : String(error)
                        );
                        return null;
                    }
                })
            )
        );

        // Calculate gear score for each character
        this.logger.info("Calculating gear score for each character...");
        const gearScores = await Promise.all(
            equipments
                .filter((x) => x !== null)
                .map(({ equipment, realmSlug }) =>
                    this.gearScoreResolver.resolve({
                        characterName: equipment.characterName,
                        realmSlug,
                        equippedItems: equipment.equippedItems,
                        forceRefresh: request.forceRefresh || false,
                    })
                )
        );
        this.logger.info(
            "Gear score calculation completed for all characters."
        );
        return gearScores;
    }
}
