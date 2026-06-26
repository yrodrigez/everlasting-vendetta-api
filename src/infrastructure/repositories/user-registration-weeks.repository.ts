import { DatabaseClient } from "@database/database-client-factory";
import {
    UserRegistrationWeeksPort,
    UserRegistrationWeeksResult,
} from "src/application/ports/user/user-registration-weeks.port";

export class UserRegistrationWeeksRepository implements UserRegistrationWeeksPort {
    constructor(private readonly databaseClient: DatabaseClient) {}

    async getUserRegistrationWeeks(
        userId: string
    ): Promise<UserRegistrationWeeksResult> {
        const userIdParam = "p_user_id";
        const { data, error } = await this.databaseClient.rpc(
            "get_user_registration_weeks",
            {
                [userIdParam]: userId,
            }
        );

        if (error) {
            throw new Error(
                `Failed to fetch user registration weeks for user ID ${userId}: ${error.message}`
            );
        }

        const record = data?.[0];
        return {
            userId: record?.[userIdParam] ?? userId,
            registeredAt: record?.registered_at
                ? new Date(record.registered_at)
                : null,
            weeksSinceRegistration: Number(record?.weeks_since_registered ?? 0),
            characterName: record?.character_name ?? null,
        };
    }
}
