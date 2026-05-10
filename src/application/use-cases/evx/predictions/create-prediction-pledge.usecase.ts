import {
    CreatePredictionPledgeInput,
    PredictionPledge,
} from "@dto/evx/predictions";
import { PredictionMarketPort } from "src/application/ports/evx/prediction-markets.port";

export class CreatePredictionPledgeUseCase {
    constructor(
        private readonly predictionMarketRepository: PredictionMarketPort
    ) {}

    async execute(
        input: CreatePredictionPledgeInput
    ): Promise<PredictionPledge> {
        return this.predictionMarketRepository.createPledge(input);
    }
}
