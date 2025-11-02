import type { WowItemDetails } from "../entities/wow/wow-item-details";

export interface WowItemCacheEntry {
    readonly itemId: number;
    readonly details: WowItemDetails;
    readonly displayId: number | null;
    readonly updatedAt: Date;
}

export interface IWowItemCacheRepository {
    get(itemId: number): Promise<WowItemCacheEntry | null>;
    save(itemId: number, details: WowItemDetails, displayId: number | null): Promise<void>;
}
