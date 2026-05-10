import { EVXLeaderboardEntry, Wallet } from "@dto/evx/wallets";

export interface WalletPort {
    findAll(): Promise<Wallet[]>;
    findLeaderboard(): Promise<EVXLeaderboardEntry[]>;
    findByUserId(userId: string): Promise<Wallet[]>;
    findById(id: string): Promise<Wallet | null>;
    create(
        wallet: Omit<Wallet, "id" | "createdAt" | "updatedAt" | "balance">
    ): Promise<Wallet>;
    addFunds(walletId: string, amount: number): Promise<Wallet>;
    subtractFunds(walletId: string, amount: number): Promise<Wallet>;
}
