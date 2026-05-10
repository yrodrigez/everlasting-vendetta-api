import {
    CreatePredictionMarketInput,
    CreatePredictionPledgeInput,
    FinalizePredictionMarketInput,
    PredictionMarket,
    PredictionMarketDetails,
    PredictionPledge,
    PredictionPledgeDetails,
} from "@dto/evx/predictions";

export interface PredictionMarketPort {
    findMarkets(): Promise<PredictionMarketDetails[]>;
    findMarketById(marketId: string): Promise<PredictionMarketDetails | null>;
    findPledgesByUserId(userId: string): Promise<PredictionPledgeDetails[]>;
    createMarket(
        input: CreatePredictionMarketInput,
        createdBy: string
    ): Promise<PredictionMarket>;
    createPledge(input: CreatePredictionPledgeInput): Promise<PredictionPledge>;
    openMarket(marketId: string): Promise<PredictionMarketDetails>;
    finalizeMarket(
        input: FinalizePredictionMarketInput
    ): Promise<PredictionMarketDetails>;
    cancelMarket(marketId: string): Promise<PredictionMarketDetails>;
}
