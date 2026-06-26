import { StorePort } from "../../application/ports/store/store.port.ts";
import { createClient, type RedisClientType, type RedisArgument } from "redis";
import { RedisConfig } from "@infrastructure/config/redis.config.ts";

export class RedisStore implements StorePort {
    private readonly client: RedisClientType;
    constructor(readonly redisConfiguration: RedisConfig) {
        const { host, port, password } = redisConfiguration.getConfig();
        const url = `redis://${host}:${port}`;
        this.client = createClient({
            url,
            password,
        });
    }
    async remove(key: string): Promise<void> {
        await this.connect();
        await this.client.del(key);
    }

    private async connect(): Promise<void> {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }

    async disconnect(): Promise<void> {
        if (this.client.isOpen) {
            this.client.destroy();
        }
    }

    private serialize<T>(value: T): RedisArgument {
        return JSON.stringify(value);
    }

    private deserialize<T>(value: RedisArgument): T {
        return JSON.parse(value.toString()) as T;
    }

    async set<T>(key: string, value: T, exp?: number): Promise<void> {
        await this.connect();
        await this.client.set(
            key,
            this.serialize(value),
            exp ? { EX: exp } : undefined
        );
    }

    async get<T>(key: string): Promise<T | null> {
        await this.connect();
        const value = await this.client.get(key);
        if (value === null) {
            return null;
        }
        return this.deserialize<T>(value);
    }
}
