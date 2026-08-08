import { getEnvironment } from "@infrastructure/environment";
import { createLogger } from "@infrastructure/logging/logger";
import { Pool } from "pg";

const cleanEnvVar = (str?: string) =>
    (str ?? "").replace(/^"+|"+$/g, "").trim();

export class SQLDatabaseClientFactory {
    private static instance: SQLDatabaseClientFactory;
    private logger = createLogger("SQLDatabaseClientFactory");
    private readonly pool: Pool;

    private constructor() {
        const { postgres } = getEnvironment();
        const user = cleanEnvVar(postgres.user);
        const password = cleanEnvVar(postgres.password);
        const host = cleanEnvVar(postgres.host);
        const port = postgres.port;
        const database = cleanEnvVar(postgres.database);
        const ssl = postgres.ssl;

        this.logger.info(
            "Initializing SQL Database Client Factory with config:",
            {
                user: cleanEnvVar(user),
                password: cleanEnvVar(password) ? "****" : undefined,
                host: cleanEnvVar(host),
                port,
                database: cleanEnvVar(database),
                ssl,
            }
        );
        if (!user || !password || !host || !database) {
            this.logger.error(
                "Missing required database configuration. Please check environment variables."
            );
            throw new Error("Database configuration is incomplete");
        }
        this.pool = new Pool({
            user,
            password,
            host,
            port,
            database,
            ssl: ssl ? { rejectUnauthorized: false } : false,
            max: 8,
            connectionTimeoutMillis: 30000,
        });
    }

    static getInstance(): SQLDatabaseClientFactory {
        if (!this.instance) {
            this.instance = new SQLDatabaseClientFactory();
        }
        return this.instance;
    }

    async close() {
        await this.pool.end();
    }

    async healthCheck(): Promise<boolean> {
        let client;
        try {
            client = await this.pool.connect();
            await client.query("SELECT 1");
            return true;
        } catch (error) {
            this.logger.error("Health check failed", error);
            return false;
        } finally {
            client?.release();
        }
    }

    async query<T>(text: string, params?: unknown[]): Promise<T[]> {
        const client = await this.pool.connect();

        try {
            const res = await client.query(text, params);
            return res.rows as T[];
        } finally {
            client.release();
        }
    }
}
