import { User } from "../entities/auth/user.ts";
import { Member } from "../entities/member.ts";

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    save(user: User): Promise<User>;
    update(user: User): Promise<User>;
    delete(userId: string): Promise<void>;
    findCharactersByUserId(userId: string, realmSlug?: string): Promise<Member[]>;
}