import { IRoleRepository } from "../../domain/repositories/i-role-repository.ts";
import { createLogger } from "../logging/index.ts";
import { DatabaseClient } from "../database/database-client-factory.ts";

export class RoleRepository implements IRoleRepository {
    constructor(
        private readonly database: DatabaseClient,
        private logger = createLogger("RoleRepository"),
    ) { }

    async findByMemberId(userId: string): Promise<string[]> {
        this.logger.debug(`Fetching roles for user ID: ${userId}`);
        const { data, error } = await this.database
            .from("ev_member_role")
            .select('role, ev_member!inner(user_id)')
            .eq('ev_member.user_id', userId)
            .returns<{ role: string }[]>();

        if (error) {
            this.logger.error(
                `Error fetching roles for member ${userId}:`,
                error,
            );
            throw new Error(
                `Error fetching roles for member ${userId}: ${error.message}`,
            );
        }

        if (!data) {
            this.logger.warn(`No roles found for member ID: ${userId}`);
            return [];
        }

        this.logger.debug(
            `Found ${data.length} roles for member ID: ${userId}`,
        );
        return [...new Set(data.map(({ role }) => role))];
    }
}
