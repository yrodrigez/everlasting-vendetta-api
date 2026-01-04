import { WoWCharacter } from "./wow/wow-character";

export type MemberCharacter = {
    id: number;
    name: string;
    realm: {
        id: number;
        name: string;
        slug: string;
    };
    level: number;
    "playable_class": {
        name?: string;
    };
    "character_class": {
        name?: string;
    };
    guild?: {
        id: number;
        name: string;
        rank: number;
    };
    avatar: string;
    "last_login_timestamp": number;
    selectedRole?: string;
    faction: string;
};

export class Member {
    constructor(
        public readonly id: number,
        public _userId: string | undefined,
        public readonly wowAccountId: number,
        public readonly character: MemberCharacter,
        public readonly registrationSource?: string,
        public readonly created_at?: Date,
        public readonly updated_at?: Date,
    ) { 
        this._userId = _userId;
    }

    public set userId(userId: string) {
        this._userId = userId;
    }
    
    public get userId(): string | undefined {
        return this._userId;
    }


    static fromWoWCharacter(character: WoWCharacter, userId: string | undefined, wowAccountId: number, registrationSource: string | null, createdAt: Date | undefined, updatedAt: Date | undefined): Member {
        return new Member(
            character.id,
            userId,
            wowAccountId,
            {
                id: character.id,
                name: character.name,
                realm: character.realm,
                level: character.level,
                playable_class: character.playable_class,
                character_class: character.character_class,
                guild: character.guild,
                avatar: character.avatar || "/avatar-anon.png",
                last_login_timestamp: character.last_login_timestamp,
                selectedRole: character.selectedRole,
                faction: character.faction,
            },
            registrationSource || undefined,
            createdAt,
            updatedAt
        )
    }

    /**
     * @deprecated Use Member.fromWoWCharacter instead
     * @param character 
     * @param userId 
     * @param wowAccountId 
     * @param registrationSource 
     * @returns 
     */
    static fromWowCharacter(character: MemberCharacter, userId: string | undefined, wowAccountId: number, registrationSource: string): Member {
        return new Member(
            character.id,
            userId,
            wowAccountId,
            character,
            registrationSource,
            undefined,
            undefined
        );
    }

    static fromDB(row: any): Member {
        return new Member(
            row.id,
            row.user_id,
            row.wow_account_id,
            {
                id: row.character.id,
                name: row.character.name,
                realm: {
                    id: row.character.realm.id,
                    name: row.character.realm.name,
                    slug: row.character.realm.slug,
                },
                level: row.character.level,
                playable_class: {
                    name: row.character.playable_class.name,
                },
                character_class: {
                    name: row.character.character_class.name,
                },
                guild: row.character.guild?.id
                    ? {
                        id: row.character.guild.id,
                        name: row.character.guild.name,
                        rank: row.character.guild.rank,
                    }
                    : undefined,
                avatar: row.character.avatar || "/avatar-anon.png",
                last_login_timestamp: row.character.last_login_timestamp,
                faction: row.character.faction || "",
            },
            row.registration_source || "bnet_oauth",
            new Date(row.created_at),
            row.updated_at ? new Date(row.updated_at) : undefined,
        );
    }

    toJSON() {
        return {
            id: this.id,
            user_id: this._userId,
            wow_account_id: this.wowAccountId,
            character: this.character,
            registration_source: this.registrationSource,
            ...(this.created_at && { created_at: this.created_at.toISOString() }),
            ...(this.updated_at && { updated_at: this.updated_at.toISOString() }),
        };
    }
}