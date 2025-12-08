import { DomainError } from "./domain-error";

export class ServiceError extends DomainError {
    constructor({ message, serviceName }: { message?: string; serviceName?: string; } = {}, readonly code = 'SERVICE_ERROR', readonly statusCode = 500) {
        super(message || 'An unexpected service error occurred');
    }
}