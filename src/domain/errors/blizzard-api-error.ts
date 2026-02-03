import { DomainError } from "./domain-error.ts";

export class BlizzardApiError extends DomainError {
	readonly code = "BLIZZARD_API_ERROR";
	statusCode = 502;
	type = "BlizzardApiError";
	constructor(message: string, statusCode?: number, textMessage?: string) {
		super(message);
		this.name = "BlizzardApiError";
		if (statusCode) {
			this.statusCode = statusCode;
		}
		if (textMessage) {
			const payload = ((() => {
				try {
					return JSON.parse(textMessage);
				} catch {
					return null;
				}
			})());
			this.message = `${this.message} - ${textMessage}`;
			if (payload?.type) {
				this.message = `${this.message} - ${payload.type}`;
				this.type = payload.type;
			}
		}
	}
}

