import {
    CreatePredictionMarketInput,
    PredictionMarket,
} from "@dto/evx/predictions";
import { PredictionMarketRepositoryError } from "@errors/evx/prediction-market-repository-error";
import { PredictionMarketPort } from "src/application/ports/evx/prediction-markets.port";

export class CreatePredictionMarketUseCase {
    constructor(
        private readonly predictionMarketRepository: PredictionMarketPort
    ) {}

    async execute(
        input: CreatePredictionMarketInput,
        createdBy: string
    ): Promise<PredictionMarket> {
        if (
            input.type !== "YES_NO" &&
            (!input.outcomes || input.outcomes.length < 2)
        ) {
            throw new PredictionMarketRepositoryError(
                "Prediction market must have at least two outcomes",
                "PREDICTION_MARKET_OUTCOMES_REQUIRED",
                400
            );
        }

        return this.predictionMarketRepository.createMarket(input, createdBy);
    }
}
