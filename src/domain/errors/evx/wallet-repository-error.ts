import { DomainError } from "@errors/domain-error";

export class WalletRepositoryError extends DomainError {
    code: string;
    statusCode: number;
    constructor(message: string, code: string = "WALLET_REPOSITORY_ERROR", statusCode: number = 500) {
        super(message);
        this.name = "WalletRepositoryError";
        this.code = code;
        this.statusCode = statusCode;
    }
}