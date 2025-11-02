import type { SupabaseClient } from "@supabase/supabase-js";
import type { IWowItemCacheRepository, WowItemCacheEntry } from "src/domain/repositories/i-wow-item-cache-repository";
import type { WowItemDetails } from "src/domain/entities/wow/wow-item-details";

type WowItemRow = {
    id: number;
    details: WowItemDetails;
    display_id: number | null;
    updated_at: string;
};

export class WowItemCacheRepository implements IWowItemCacheRepository {
    constructor(private readonly supabase: SupabaseClient) { }

    async get(itemId: number): Promise<WowItemCacheEntry | null> {
        const { data, error } = await this.supabase
            .from("wow_items")
            .select("id, details, display_id, updated_at")
            .eq("id", itemId)
            .limit(1)
            .maybeSingle<WowItemRow>();

        if (error) {
            console.error("WowItemCacheRepository::get - error", error);
            return null;
        }

        if (!data) {
            return null;
        }

        return {
            itemId: data.id,
            details: data.details,
            displayId: data.display_id,
            updatedAt: new Date(data.updated_at),
        };
    }

    async save(itemId: number, details: WowItemDetails, displayId: number | null): Promise<void> {
        const { error } = await this.supabase.from("wow_items").upsert({
            id: itemId,
            details,
            display_id: displayId,
            updated_at: new Date().toISOString(),
        });

        if (error) {
            console.error("WowItemCacheRepository::save - error", error);
        }
    }
}
