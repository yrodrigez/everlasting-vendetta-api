import { PredictionMarketDetails } from "@dto/evx/predictions";
import { PredictionMarketPort } from "src/application/ports/evx/prediction-markets.port";

export class OpenPredictionMarketUseCase {
    constructor(
        private readonly predictionMarketRepository: PredictionMarketPort
    ) {}

    async execute(marketId: string): Promise<PredictionMarketDetails> {
        return this.predictionMarketRepository.openMarket(marketId);
    }
}
