import { DomainError } from "@errors/domain-error";

export class PredictionMarketRepositoryError extends DomainError {
    code: string;
    statusCode: number;

    constructor(
        message: string,
        code: string = "PREDICTION_MARKET_REPOSITORY_ERROR",
        statusCode: number = 500
    ) {
        super(message);
        this.name = "PredictionMarketRepositoryError";
        this.code = code;
        this.statusCode = statusCode;
    }
}
