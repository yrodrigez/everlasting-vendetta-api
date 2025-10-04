import { DomainError } from "./domain-error";

export class AuthError extends DomainError {
    public readonly code: string;
    public readonly statusCode: number;

    constructor(message: string, code: string = 'AUTH_ERROR', statusCode: number = 401) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
} 