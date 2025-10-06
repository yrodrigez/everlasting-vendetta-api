import { IUserRepository } from "../../domain/repositories/i-user-repository.ts";
import { User } from "../../domain/entities/auth/user.ts";
import { Member } from "../../domain/entities/member.ts";
import { DatabaseClient } from "../database/database-client-factory.ts";
import { UserRepositoryError } from "../../domain/errors/user-repository-error.ts";

const USER_TABLE = "users";
const MEMBER_TABLE = "ev_member";

export class UserRepository implements IUserRepository {
    constructor(private readonly database: DatabaseClient) { }

    async findById(id: string): Promise<User | null> {
        const { data, error } = await this.database
            .from(USER_TABLE)
            .select("*")
            .eq("id", id)
            .limit(1)
            .maybeSingle();

        if (error) {
            throw new UserRepositoryError(
                `Error fetching user by ID: ${error.message || "Unknown error"}`,
            );
        }

        if (!data) {
            return null;
        }

        return User.fromDatabase(data);
    }

    async findByUsername(username: string): Promise<User | null> {
        const { data, error } = await this.database
            .from(USER_TABLE)
            .select("*")
            .eq("user_name", username)
            .limit(1)
            .maybeSingle();

        if (error) {
            throw new UserRepositoryError(
                `Error fetching user by username: ${error.message || "Unknown error"}`,
            );
        }

        if (!data) {
            return null;
        }

        return User.fromDatabase(data);
    }

    async findAll(): Promise<User[]> {
        const { data, error } = await this.database
            .from(USER_TABLE)
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            throw new UserRepositoryError(
                `Error fetching all users: ${error.message || "Unknown error"}`,
            );
        }

        if (!data) {
            return [];
        }

        return data.map((row) => User.fromDatabase(row));
    }

    async save(user: User): Promise<User> {
        const userData = user.toDatabase();

        const { data, error } = await this.database
            .from(USER_TABLE)
            .insert(userData)
            .select()
            .maybeSingle();

        if (error) {
            if (error.code === "23505") { // Unique violation
                throw new UserRepositoryError(
                    "User with this ID or username already exists.",
                );
            }
            throw new UserRepositoryError(
                `Error saving user: ${error.message || "Unknown error"}`,
            );
        }

        if (!data) {
            throw new UserRepositoryError(
                "Failed to save user, no data returned from database",
            );
        }

        return User.fromDatabase(data);
    }

    async update(user: User): Promise<User> {
        const userData = user.toDatabase();

        const { data, error } = await this.database
            .from(USER_TABLE)
            .update(userData)
            .eq("id", user.id)
            .select()
            .maybeSingle();

        if (error) {
            if (error.code === "23505") { // Unique violation
                throw new UserRepositoryError(
                    "User with this username already exists.",
                );
            }
            throw new UserRepositoryError(
                `Error updating user: ${error.message || "Unknown error"}`,
            );
        }

        if (!data) {
            throw new UserRepositoryError(
                "Failed to update user, no data returned from database",
            );
        }

        return User.fromDatabase(data);
    }

    async delete(userId: string): Promise<void> {
        const { error } = await this.database
            .from(USER_TABLE)
            .delete()
            .eq("id", userId);

        if (error) {
            throw new UserRepositoryError(
                `Error deleting user: ${error.message || "Unknown error"}`,
            );
        }
    }

    async findCharactersByUserId(userId: string, realmSlug?: string): Promise<Member[]> {
        let query = this.database
            .from(MEMBER_TABLE)
            .select("*")
            .eq("user_id", userId);

        // If realmSlug is provided, filter by realm slug in the JSONB character column
        if (realmSlug) {
            query = query.eq("character->realm->>slug", realmSlug);
        }

        const { data, error } = await query;

        if (error) {
            throw new UserRepositoryError(
                `Error fetching characters for user: ${error.message || "Unknown error"}`,
            );
        }

        if (!data) {
            return [];
        }

        return data.map((row) => Member.fromDB(row));
    }
}
