import { PredictionMarketDetails } from "@dto/evx/predictions";
import { PredictionMarketRepositoryError } from "@errors/evx/prediction-market-repository-error";
import { PredictionMarketPort } from "src/application/ports/evx/prediction-markets.port";

export class FindPredictionMarketByIdUseCase {
    constructor(
        private readonly predictionMarketRepository: PredictionMarketPort
    ) {}

    async execute(marketId: string): Promise<PredictionMarketDetails> {
        const market =
            await this.predictionMarketRepository.findMarketById(marketId);

        if (!market) {
            throw new PredictionMarketRepositoryError(
                "Market not found",
                "MARKET_NOT_FOUND",
                404
            );
        }

        return market;
    }
}
