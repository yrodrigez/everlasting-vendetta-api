import { Provider } from "./provider";

export interface AuthenticateUserWithBattleNetInput {
    bnetToken: string;
    expires_at: number; // Optional expiry timestamp in seconds
    provider: Provider;
    ipAddress?: string;
    userAgent?: string;
}