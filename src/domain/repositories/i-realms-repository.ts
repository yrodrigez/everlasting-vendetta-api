import { Realm } from "@entities/wow/wow-character";

export interface IRealmsRepository {
    getAllowedRealms(): Promise<Realm[]>;
}