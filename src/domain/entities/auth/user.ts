export class User {
    constructor(
        public readonly id: string,
        public readonly name: string | null = null,
        public readonly userName: string | null = null,
        public readonly avatarUrl: string | null = null,
        public readonly createdAt: Date | null = null,
        public readonly lastModified: Date | null = null,
    ) {}

    static fromDatabase(row: DatabaseUser): User {
        return new User(
            row.id,
            row.name ?? null,
            row.user_name ?? null,
            row.avatar_url ?? null,
            row.created_at ? new Date(row.created_at) : null,
            row.last_modified ? new Date(row.last_modified) : null,
        );
    }

    toDatabase(): Partial<DatabaseUser> {
        return {
            id: this.id,
            name: this.name,
            user_name: this.userName,
            avatar_url: this.avatarUrl,
            last_modified: new Date().toISOString(),
        };
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            user_name: this.userName,
            avatar_url: this.avatarUrl,
            created_at: this.createdAt?.toISOString(),
            last_modified: this.lastModified?.toISOString(),
        };
    }
}

export interface DatabaseUser {
    id: string;
    name?: string | null;
    user_name?: string | null;
    avatar_url?: string | null;
    created_at?: string | null;
    last_modified?: string | null;
}
