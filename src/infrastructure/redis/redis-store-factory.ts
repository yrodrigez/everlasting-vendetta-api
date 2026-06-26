import type { StorePort } from "src/application/ports/store/store.port";
import { RedisConfig } from "@infrastructure/config/redis.config";
import { RedisStore } from "@infrastructure/redis/redis-store";

export class RedisStoreFactory {
    private static instance: StorePort | null = null;

    static getInstance(): StorePort {
        if (!RedisStoreFactory.instance) {
            RedisStoreFactory.instance = new RedisStore(new RedisConfig());
        }

        return RedisStoreFactory.instance;
    }
}
