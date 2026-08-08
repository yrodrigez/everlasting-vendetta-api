import type { IMemberRepository } from "@domain/repositories/i-member-repository.ts";
import { Member } from "@domain/entities/member.ts";
import type { DatabaseClient } from "@infrastructure/database/database-client-factory.ts";
import { MemberRepositoryError } from "@domain/errors/member-repository-error.ts";
import type { SQLDatabaseClientFactory } from "@infrastructure/database/sql/sql-database-client-factory.ts";

const MEMBER_TABLE = "ev_member";

export class MemberRepository implements IMemberRepository {
    constructor(
        private readonly database: DatabaseClient,
        private readonly postgresClient: SQLDatabaseClientFactory
    ) {}

    async setSelectedCharacterForUser({
        userId,
        characterId,
    }: {
        userId: string;
        characterId: number;
    }): Promise<void> {
        const query = /* sql */ `
            UPDATE ${MEMBER_TABLE} AS member
            SET is_selected = (member.id = $1)
            WHERE member.user_id = $2
            AND EXISTS (
                SELECT 1
                FROM ${MEMBER_TABLE} AS target
                WHERE target.id = $1
                    AND target.user_id = $2
            )
            RETURNING id;
        `;

        try {
            await this.postgresClient.query(query, [characterId, userId]);
        } catch (error: any) {
            throw new MemberRepositoryError(
                `Error setting selected character for user: ${error.message || "Unknown error"}`
            );
        }
    }

    async isUserGuildMember(
        userId: string,
        realmSlugs: string[]
    ): Promise<boolean> {
        const { data, error } = await this.database
            .from(MEMBER_TABLE)
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("character->guild->>name", "Everlasting Vendetta")
            .in("character->realm->>slug", realmSlugs)
            .limit(1);

        if (error) {
            throw new MemberRepositoryError(
                `Error checking if user is guild member: ${error.message || "Unknown error"}`
            );
        }

        return (data?.length ?? 0) > 0;
    }

    async unlinkAllFromUserId(userId: string): Promise<Member[]> {
        const { data, error } = await this.database
            .from(MEMBER_TABLE)
            .update({ user_id: null, wow_account_id: 0 })
            .eq("user_id", userId)
            .select("*");

        if (error) {
            throw new MemberRepositoryError(
                `Error unlinking members from user ID: ${error.message || "Unknown error"}`
            );
        }

        if (!data) {
            return [];
        }

        return data.map((row: any) => Member.fromDB(row));
    }

    async findAllByRealmSlugAndNames(
        realmSlug: string,
        characterNames: string[]
    ): Promise<Member[]> {
        const normalizedRealm = realmSlug.trim().toLowerCase();
        const normalizedNames = characterNames.map((name) => name.trim());
        const { data, error } = await this.database
            .from(MEMBER_TABLE)
            .select("*")
            .eq("character->realm->>slug", normalizedRealm)
            .in("character->>name", normalizedNames);

        if (error) {
            throw new MemberRepositoryError(
                `Error fetching members by realm and names: ${error.message || "Unknown error"}`
            );
        }

        if (!data) {
            return [];
        }

        return data.map((row: object) => Member.fromDB(row));
    }

    async findById(id: number): Promise<Member | null> {
        const { data, error } = await this.database
            .from(MEMBER_TABLE)
            .select("*")
            .eq("id", id)
            .limit(1)
            .maybeSingle();

        if (error) {
            throw new MemberRepositoryError(
                `Error fetching member by ID: ${
                    error.message || "Unknown error"
                }`
            );
        }

        if (!data) {
            return null;
        }

        return Member.fromDB(data);
    }

    async findAll(): Promise<Member[]> {
        const { data, error } = await this.database
            .from(MEMBER_TABLE)
            .select("*");

        if (error) {
            throw new MemberRepositoryError(
                `Error fetching all members: ${
                    error.message || "Unknown error"
                }`
            );
        }
        if (!data) {
            return [];
        }

        return data.map((row: object) => Member.fromDB(row));
    }

    async findByRealmSlugAndName(
        realmSlug: string,
        characterName: string
    ): Promise<Member | null> {
        const normalizedRealm = realmSlug.trim().toLowerCase();
        const normalizedName = characterName.trim();

        const { data, error } = await this.database
            .from(MEMBER_TABLE)
            .select("*")
            .eq("character->realm->>slug", normalizedRealm)
            .ilike("character->>name", normalizedName)
            .limit(1)
            .maybeSingle();

        if (error) {
            throw new MemberRepositoryError(
                `Error fetching member by realm and name: ${error.message || "Unknown error"}`
            );
        }

        if (!data) {
            return null;
        }

        return Member.fromDB(data);
    }

    async save(member: Member): Promise<Member> {
        const memberData = {
            character: member.character,
            user_id: member.userId,
            wow_account_id: member.wowAccountId,
            registration_source: member.registrationSource,
        };

        const { data, error } = await this.database
            .from(MEMBER_TABLE)
            .insert(memberData)
            .select()
            .maybeSingle();

        if (error) {
            if (error.code === "23505") {
                // Unique violation
                throw new MemberRepositoryError(
                    "Member with this user ID or WoW account ID already exists."
                );
            }
            throw new MemberRepositoryError(
                `Error saving member: ${error.message || "Unknown error"}`
            );
        }

        if (!data) {
            throw new MemberRepositoryError(
                "Failed to save member, no data returned from database"
            );
        }

        return Member.fromDB(data);
    }

    async update(member: Member): Promise<Member> {
        const memberData = {
            character: member.character,
            user_id: member.userId,
            wow_account_id: member.wowAccountId,
            registration_source: member.registrationSource,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await this.database
            .from(MEMBER_TABLE)
            .update(memberData)
            .eq("id", member.id)
            .select()
            .maybeSingle();

        if (error) {
            if (error.code === "23505") {
                // Unique violation
                throw new MemberRepositoryError(
                    "Member with this user ID or WoW account ID already exists."
                );
            }
            throw new MemberRepositoryError(
                `Error updating member: ${error.message || "Unknown error"}`
            );
        }

        if (!data) {
            throw new MemberRepositoryError(
                "Failed to update member, no data returned from database"
            );
        }

        return Member.fromDB(data);
    }

    async upsert(member: Member): Promise<Member> {
        const memberData = {
            id: member.id,
            character: member.character,
            user_id: member.userId,
            wow_account_id: member.wowAccountId,
            registration_source: member.registrationSource,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await this.database
            .from(MEMBER_TABLE)
            .upsert(memberData, { onConflict: "id" })
            .select()
            .maybeSingle();

        if (error) {
            if (error.code === "23505") {
                // Unique violation
                throw new MemberRepositoryError(
                    "Member with this user ID or WoW account ID already exists."
                );
            }
            throw new MemberRepositoryError(
                `Error upserting member: ${error.message || "Unknown error"}`
            );
        }

        if (!data) {
            throw new MemberRepositoryError(
                "Failed to upsert member, no data returned from database"
            );
        }

        return Member.fromDB(data);
    }

    async upsertMany(
        members: Member[],
        dangerouslyAllowEmptyValues: (keyof Member)[] = []
    ): Promise<Member[]> {
        if (members.length === 0) {
            return [];
        }

        const { data, error } = await this.database
            .from(MEMBER_TABLE)
            .upsert(
                members.map((m) =>
                    Object.fromEntries(
                        Object.entries(m.toJSON()).filter(([k, v]) => {
                            return (
                                dangerouslyAllowEmptyValues.includes(
                                    k as keyof Member
                                ) || Boolean(v)
                            );
                        })
                    )
                ),
                { onConflict: "id" }
            )
            .select("*");

        if (error) {
            if (error.code === "23505") {
                // Unique violation
                throw new MemberRepositoryError(
                    "Member with this user ID or WoW account ID already exists."
                );
            }
            throw new MemberRepositoryError(
                `Error upserting members: ${error.message || "Unknown error"}`
            );
        }

        if (!data) {
            throw new MemberRepositoryError(
                "Failed to upsert members, no data returned from database"
            );
        }

        return data.map((item: any) => Member.fromDB(item));
    }

    async findByUserIdAndCharacterId(
        userId: string,
        characterId: number
    ): Promise<Member | null> {
        const { data, error } = await this.database
            .from(MEMBER_TABLE)
            .select("*")
            .eq("user_id", userId)
            .eq("id", characterId)
            .limit(1)
            .maybeSingle();

        if (error) {
            throw new MemberRepositoryError(
                `Error fetching member by user ID and character ID: ${error.message || "Unknown error"}`
            );
        }

        if (!data) {
            return null;
        }

        return Member.fromDB(data);
    }

    async findSelectedByUserId(userId: string): Promise<Member | null> {
        const { data, error } = await this.database
            .from(MEMBER_TABLE)
            .select("*")
            .eq("user_id", userId)
            .eq("is_selected", true)
            .limit(1)
            .maybeSingle();

        if (error) {
            throw new MemberRepositoryError(
                `Error fetching selected member by user ID: ${error.message || "Unknown error"}`
            );
        }

        if (!data) {
            return null;
        }

        return Member.fromDB(data);
    }

    async findAllByUserId(
        userId: string,
        realmSlugs?: string[]
    ): Promise<Member[]> {
        const { data, error } = await (() => {
            if (realmSlugs && realmSlugs.length > 0) {
                const normalizedSlugs = realmSlugs.map((slug) =>
                    slug.trim().toLowerCase()
                );
                return this.database
                    .from(MEMBER_TABLE)
                    .select("*")
                    .eq("user_id", userId)
                    .in("character->realm->>slug", normalizedSlugs);
            }

            return this.database
                .from(MEMBER_TABLE)
                .select("*")
                .eq("user_id", userId);
        })();

        if (error) {
            throw new MemberRepositoryError(
                `Error fetching members by user ID: ${error.message || "Unknown error"}`
            );
        }

        if (!data) {
            return [];
        }

        return data.map((row: any) => Member.fromDB(row));
    }
}
