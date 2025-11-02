import { DatabaseClient } from "@database/database-client-factory";
import { IBannedRepository } from "@repositories/i-banned-repository";

export class BannedRepository implements IBannedRepository {
    constructor(
        private readonly database: DatabaseClient
    ) { }
    async isUserBanned(userId: string): Promise<boolean> {

        const { data, error } = await this.database
            .from('ev_member')
            .select('user_id, banned_member(id, user_id)')
            .eq('user_id', userId)
            .overrideTypes<{ user_id: string, banned_member: { id: string, user_id: string }[] }[]>();

        if (error) {
            throw new Error(`Error checking ban status for user ${userId}: ${error.message}`);
        }


        return data?.some(member => member?.banned_member?.length > 0) ?? false;
    }

    async banUser(userId: string, reason: string): Promise<void> {
        // Implement your logic to ban the user
        throw new Error("Method not implemented.");
    }

    async unbanUser(userId: string): Promise<void> {
        // Implement your logic to unban the user
        throw new Error("Method not implemented.");
    }
}
