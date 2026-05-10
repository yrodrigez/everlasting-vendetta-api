import { PredictionPledgeDetails } from "@dto/evx/predictions";
import { PredictionMarketPort } from "src/application/ports/evx/prediction-markets.port";

export class FindMyPredictionPledgesUseCase {
    constructor(
        private readonly predictionMarketRepository: PredictionMarketPort
    ) {}

    async execute(userId: string): Promise<PredictionPledgeDetails[]> {
        return this.predictionMarketRepository.findPledgesByUserId(userId);
    }
}
