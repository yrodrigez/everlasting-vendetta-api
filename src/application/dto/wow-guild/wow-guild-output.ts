import { Realm } from "@dto/wow/wow-base";


export interface WowGuildOutput {
    id: string;
    name: string;
    realm: Realm;
    faction: 'Alliance' | 'Horde';
    membersCount: number;
    members: {
        key: {
            href: string;
        }
        name: string;
        realm: Realm;
    }[];
}