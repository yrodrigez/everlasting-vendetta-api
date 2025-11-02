export interface IBannedRepository {
    isUserBanned(userId: string): Promise<boolean>;
    banUser(userId: string, reason: string): Promise<void>;
    unbanUser(userId: string): Promise<void>;
}
