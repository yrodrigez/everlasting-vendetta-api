import {
    DatabaseClient,
    DatabaseClientFactory,
} from "@database/database-client-factory";
import { SQLDatabaseClientFactory } from "@database/sql/sql-database-client-factory";
import { RedisStoreFactory } from "@infrastructure/redis/redis-store-factory";
import { createToken, type Container } from "../container";
import { type StorePort } from "src/application/ports/store/store.port";

export const DATABASE_TOKENS = {
    SupabaseClient: createToken<DatabaseClient>("SupabaseClient"),
    PostgresSQLClient:
        createToken<SQLDatabaseClientFactory>("PostgresSQLClient"),
    RedisStore: createToken<StorePort>("RedisStore"),
} as const;

export function registerDatabaseDependencies(container: Container): void {
    container.singleton(DATABASE_TOKENS.SupabaseClient, () =>
        DatabaseClientFactory.getInstance()
    );

    container.singleton(DATABASE_TOKENS.PostgresSQLClient, () =>
        SQLDatabaseClientFactory.getInstance()
    );

    container.singleton(DATABASE_TOKENS.RedisStore, () =>
        RedisStoreFactory.getInstance()
    );
}
