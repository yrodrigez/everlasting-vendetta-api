export abstract class DomainError extends Error {
	abstract readonly code: string;
	abstract readonly statusCode: number;
}