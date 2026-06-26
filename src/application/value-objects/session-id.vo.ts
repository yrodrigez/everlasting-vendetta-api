import { randomBytes } from "crypto";

export class SessionId {
    private constructor(private readonly value: string) {}

    static generate(): SessionId {
        return new SessionId(randomBytes(32).toString("base64url"));
    }

    static from(value: string): SessionId {
        if (!value.trim()) {
            throw new Error("SessionId cannot be empty");
        }

        return new SessionId(value);
    }

    getValue(): string {
        return this.value;
    }

    toString(): string {
        return this.value;
    }
}
