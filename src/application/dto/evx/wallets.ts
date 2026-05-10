export interface Wallet {
    id: string;
    userId: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface EVXLeaderboardEntry {
    rank: number;
    userId: string;
    walletId: string;
    selectedCharacterName: string | null;
    selectedCharacterAvatar: string | null;
    balance: number;
    totalPledged: number;
    activePledged: number;
    totalWon: number;
    totalLost: number;
    totalRefunded: number;
    netProfit: number;
    marketsWon: number;
    marketsLost: number;
    pledgeCount: number;
}
