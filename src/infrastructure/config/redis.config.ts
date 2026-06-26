import "dotenv/config";

export class RedisConfig {
    private readonly password: string;
    private readonly host: string;
    private readonly port: number;
    constructor() {
        this.password = process.env.REDIS_PASSWORD!;
        this.host = process.env.REDIS_HOST!;
        this.port = parseInt(process.env.REDIS_PORT!);
    }

    getConfig() {
        if (!this.password || !this.host || !this.port) {
            throw new Error(
                "Missing Redis configuration. Please ensure REDIS_PASSWORD, REDIS_HOST, and REDIS_PORT are set in the environment variables."
            );
        }
        return {
            host: this.host,
            port: this.port,
            password: this.password,
        };
    }
}
