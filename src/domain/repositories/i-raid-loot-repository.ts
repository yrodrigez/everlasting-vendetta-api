export interface RaidLootItemData {
    id: number;
    name: string;
    description: Record<string, unknown>;
}

export interface Raid {
    id: string;
    name: string;
    min_level: number;
    created_at: string;
    image: string;
    reservation_amount: number;
    short_name: string;
    min_gs: number;
    size: number;
}

export interface IRaidLootRepository {
    upsertItem(item: RaidLootItemData): Promise<void>;
    upsertBoss(name: string): Promise<{ id: string; name: string }>;
    linkItemToBoss(itemId: number, bossId: string): Promise<void>;
    linkItemToRaid(itemId: number, raidId: string): Promise<void>;
    getRaids(): Promise<Raid[]>;
}
