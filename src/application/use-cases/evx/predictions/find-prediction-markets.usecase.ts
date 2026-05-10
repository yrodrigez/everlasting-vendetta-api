import { PredictionMarketDetails } from "@dto/evx/predictions";
import { PredictionMarketPort } from "src/application/ports/evx/prediction-markets.port";

export class FindPredictionMarketsUseCase {
    constructor(
        private readonly predictionMarketRepository: PredictionMarketPort
    ) {}

    async execute(): Promise<PredictionMarketDetails[]> {
        return this.predictionMarketRepository.findMarkets();
    }
}
