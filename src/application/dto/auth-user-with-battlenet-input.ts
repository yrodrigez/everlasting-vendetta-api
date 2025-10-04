export interface AuthenticateUserWithBattleNetInput {
    bnetToken: string;
    expires_at: number; // Optional expiry timestamp in seconds
    provider: 'bnet' | 'discord';
    ipAddress?: string;
    userAgent?: string;
}