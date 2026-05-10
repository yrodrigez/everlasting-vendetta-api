type Factory<T> = (container: Container) => T

export class Container {
    private factories = new Map<string, Factory<unknown>>()
    private singletons = new Map<string, unknown>()

    register<T>(key: string, factory: Factory<T>) {
        this.factories.set(key, factory)
    }

    resolve<T>(key: string): T {
        const factory = this.factories.get(key)

        if (!factory) {
            throw new Error(`Dependency not registered: ${key}`)
        }

        return factory(this) as T
    }

    singleton<T>(key: string, factory: Factory<T>) {
        this.factories.set(key, container => {
            if (!this.singletons.has(key)) {
                this.singletons.set(key, factory(container))
            }

            return this.singletons.get(key) as T
        })
    }
}