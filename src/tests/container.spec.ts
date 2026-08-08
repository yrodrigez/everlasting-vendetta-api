import { describe, expect, it, jest } from "@jest/globals";
import { Container, createToken } from "../infrastructure/di/container";

describe("Container", () => {
    it("throws when resolving an unregistered token", () => {
        const container = new Container();
        const token = createToken<string>("Missing");

        expect(() => container.resolve(token)).toThrow(
            "No registration for token: Symbol(Missing)"
        );
    });

    it("rejects duplicate registrations", () => {
        const container = new Container();
        const token = createToken<string>("Service");
        container.singleton(token, () => "first");

        expect(() => container.transient(token, () => "second")).toThrow(
            "Token already registered: Symbol(Service)"
        );
    });

    it("returns the same singleton instance", () => {
        const container = new Container();
        const token = createToken<object>("Singleton");
        const factory = jest.fn(() => ({}));
        container.singleton(token, factory);

        expect(container.resolve(token)).toBe(container.resolve(token));
        expect(factory).toHaveBeenCalledTimes(1);
    });

    it("creates a new transient instance for every resolution", () => {
        const container = new Container();
        const token = createToken<object>("Transient");
        const factory = jest.fn(() => ({}));
        container.transient(token, factory);

        expect(container.resolve(token)).not.toBe(container.resolve(token));
        expect(factory).toHaveBeenCalledTimes(2);
    });

    it("reports the circular dependency path", () => {
        const container = new Container();
        const firstToken = createToken<object>("First");
        const secondToken = createToken<object>("Second");
        container.singleton(firstToken, (currentContainer) =>
            currentContainer.resolve(secondToken)
        );
        container.singleton(secondToken, (currentContainer) =>
            currentContainer.resolve(firstToken)
        );

        expect(() => container.resolve(firstToken)).toThrow(
            "Circular dependency detected: Symbol(First) -> Symbol(Second) -> Symbol(First)"
        );
    });

    it("treats tokens with the same description as different identities", () => {
        const container = new Container();
        const firstToken = createToken<string>("Service");
        const secondToken = createToken<string>("Service");
        container.singleton(firstToken, () => "first");
        container.singleton(secondToken, () => "second");

        expect(container.resolve(firstToken)).toBe("first");
        expect(container.resolve(secondToken)).toBe("second");
    });
});
