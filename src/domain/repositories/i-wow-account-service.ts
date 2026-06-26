import { WowUserProfile } from "../entities/wow/wow-user-profile.ts";

export interface IWowAccountService {
    getWoWAccount(token: string): Promise<WowUserProfile>;
}
