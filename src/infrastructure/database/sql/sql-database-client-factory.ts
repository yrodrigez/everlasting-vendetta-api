import { getEnvironment } from "@infrastructure/environment";
import { createLogger } from "@infrastructure/logging/logger";
import { Pool } from "pg";

const { postgres } = getEnvironment();

const cleanEnvVar = (str?: string) =>
    (str ?? "").replace(/^"+|"+$/g, "").trim();

export class SQLDatabaseClientFactory {
    private static instance: SQLDatabaseClientFactory;
    private logger = createLogger("SQLDatabaseClientFactory");
    private readonly pool: Pool;

    private constructor(
        private readonly user: string = cleanEnvVar(postgres.user),
        private readonly password: string = cleanEnvVar(postgres.password),
        private readonly host: string = cleanEnvVar(postgres.host),
        private readonly port: number = postgres.port,
        private readonly database: string = cleanEnvVar(postgres.database),
        private readonly ssl: boolean = postgres.ssl
    ) {
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
            user: this.user,
            password: this.password,
            host: this.host,
            port: this.port,
            database: this.database,
            ssl: this.ssl ? { rejectUnauthorized: false } : false,
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
