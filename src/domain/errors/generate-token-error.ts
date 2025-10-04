import { DomainError } from "./domain-error.ts";

export class GenerateTokenError extends DomainError {
    public readonly statusCode = 500;
    public readonly code = "GENERATE_TOKEN_ERROR";

    constructor(message: string) {
        super(`GenerateTokenError: ${message}`);
    }
}
