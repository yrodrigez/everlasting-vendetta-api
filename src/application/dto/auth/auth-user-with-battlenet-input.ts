import { Provider } from "./provider";

export interface AuthenticateUserWithBattleNetInput {
    bnetToken: string;
    expires_at: number; // Optional expiry timestamp in seconds
    ipAddress?: string;
    userAgent?: string;
}
