type Factory<T> = (container: Container) => T;
export type Token<T> = symbol & { readonly __type?: T };
export const createToken = <T>(description: string): Token<T> =>
    Symbol(description) as Token<T>;

type Lifetime = "transient" | "singleton";

type Registration<T> = {
    factory: (container: Container) => T;
    lifetime: Lifetime;
    instance?: T;
    initialized: boolean;
};

export class Container {
    private readonly registrations = new Map<symbol, Registration<unknown>>();
    private readonly resolving: symbol[] = [];

    private register<T>(
        token: Token<T>,
        factory: Factory<T>,
        lifetime: Lifetime
    ): void {
        if (this.registrations.has(token)) {
            throw new Error(`Token already registered: ${token.toString()}`);
        }

        this.registrations.set(token, {
            factory,
            lifetime,
            initialized: false,
        });
    }

    transient<T>(token: Token<T>, factory: Factory<T>): void {
        this.register(token, factory, "transient");
    }

    singleton<T>(token: Token<T>, factory: Factory<T>): void {
        this.register(token, factory, "singleton");
    }

    resolve<T>(token: Token<T>): T {
        if (!this.registrations.has(token)) {
            throw new Error(`No registration for token: ${token.toString()}`);
        }

        const cycleIndex = this.resolving.indexOf(token);
        if (cycleIndex !== -1) {
            const cycle = [...this.resolving.slice(cycleIndex), token]
                .map((currentToken) => currentToken.toString())
                .join(" -> ");

            throw new Error(`Circular dependency detected: ${cycle}`);
        }

        this.resolving.push(token);

        try {
            return this._resolve(
                this.registrations.get(token)! as Registration<T>
            );
        } finally {
            this.resolving.pop();
        }
    }

    private _resolve<T>(registration: Registration<T>): T {
        if (registration.lifetime === "singleton") {
            if (!registration.initialized) {
                registration.instance = registration.factory(this);
                registration.initialized = true;
            }
            return registration.instance as T;
        }

        return registration.factory(this) as T;
    }
}
