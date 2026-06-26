import { Member } from "../entities/member.ts";

export interface IMemberRepository {
    findById(id: number): Promise<Member | null>;
    findAll(): Promise<Member[]>;
    save(member: Member): Promise<Member>;
    update(member: Member): Promise<Member>;
    upsert(member: Member): Promise<Member>;
    upsertMany(
        members: Member[],
        dangerouslyAllowEmptyValues?: (keyof Member)[]
    ): Promise<Member[]>;
    findByRealmSlugAndName(
        realmSlug: string,
        characterName: string
    ): Promise<Member | null>;
    findByUserIdAndCharacterId(
        userId: string,
        characterId: number
    ): Promise<Member | null>;
    findAllByUserId(userId: string, realmSlugs?: string[]): Promise<Member[]>;
    findAllByRealmSlugAndNames(
        realmSlug: string,
        characterNames: string[]
    ): Promise<Member[]>;

    unlinkAllFromUserId(userId: string): Promise<Member[]>;
    isUserGuildMember(userId: string, realmSlugs: string[]): Promise<boolean>;
    findSelectedByUserId(userId: string): Promise<Member | null>;
}
