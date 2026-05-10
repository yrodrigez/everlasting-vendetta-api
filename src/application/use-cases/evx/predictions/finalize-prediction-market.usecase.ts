import {
    FinalizePredictionMarketInput,
    PredictionMarketDetails,
} from "@dto/evx/predictions";
import { PredictionMarketPort } from "src/application/ports/evx/prediction-markets.port";

export class FinalizePredictionMarketUseCase {
    constructor(
        private readonly predictionMarketRepository: PredictionMarketPort
    ) {}

    async execute(
        input: FinalizePredictionMarketInput
    ): Promise<PredictionMarketDetails> {
        return this.predictionMarketRepository.finalizeMarket(input);
    }
}
