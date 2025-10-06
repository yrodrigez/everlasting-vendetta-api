import { DomainError } from "./domain-error.ts";

export class UserRepositoryError extends DomainError {
	public readonly statusCode: number;
	public readonly code: string;
	constructor(message: string) {
		super(`UserRepositoryError: ${message}`);
		this.statusCode = 500;
		this.code = 'USER_REPOSITORY_ERROR';
	}
}
