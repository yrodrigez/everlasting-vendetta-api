export type PredictionMarketStatus =
    | "DRAFT"
    | "OPEN"
    | "LOCKED"
    | "RESOLVED"
    | "CANCELLED";

export type PredictionMarketType =
    | "YES_NO"
    | "MULTIPLE_CHOICE"
    | "NUMERIC_RANGE";

export type PredictionPledgeStatus =
    | "ACTIVE"
    | "CANCELLED"
    | "WON"
    | "LOST"
    | "REFUNDED";

export interface PredictionOutcome {
    id: string;
    marketId: string;
    label: string;
    sortOrder: number;
    createdAt: Date;
}

export interface PredictionMarket {
    id: string;
    resetId: string | null;
    title: string;
    description: string | null;
    status: PredictionMarketStatus;
    closesAt: Date;
    resolvedOutcomeId: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    type: PredictionMarketType;
    outcomes: PredictionOutcome[];
}

export interface PredictionPledge {
    id: string;
    marketId: string;
    outcomeId: string;
    walletId: string;
    amount: number;
    status: PredictionPledgeStatus;
    createdAt: Date;
    updatedAt: Date;
    walletBalanceAfter: number;
}

export interface PredictionOutcomeStats extends PredictionOutcome {
    totalPledged: number;
    pledgeCount: number;
    impliedProbability: number;
}

export interface PredictionPledgeDetails {
    id: string;
    marketId: string;
    outcomeId: string;
    walletId: string;
    userId: string;
    amount: number;
    status: PredictionPledgeStatus;
    createdAt: Date;
    updatedAt: Date;
    marketTitle: string;
    marketStatus: PredictionMarketStatus;
    outcomeLabel: string;
}

export interface PredictionMarketDetails extends Omit<
    PredictionMarket,
    "outcomes"
> {
    outcomes: PredictionOutcomeStats[];
    pledges: PredictionPledgeDetails[];
    totalPool: number;
    pledgeCount: number;
}

export interface FinalizePredictionMarketInput {
    marketId: string;
    resolvedOutcomeId: string;
}

export interface CreatePredictionMarketInput {
    resetId?: string | null;
    title: string;
    description?: string | null;
    closesAt: Date;
    type: PredictionMarketType;
    outcomes?: string[] | null;
}

export interface CreatePredictionPledgeInput {
    marketId: string;
    outcomeId: string;
    userId: string;
    amount: number;
}
