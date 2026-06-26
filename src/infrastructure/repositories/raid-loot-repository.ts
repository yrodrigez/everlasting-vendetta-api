import { DatabaseClient } from "@database/database-client-factory";
import { ServiceError } from "@errors/service-error";
import { createLogger } from "@infrastructure/logging";
import {
    IRaidLootRepository,
    Raid,
    RaidLootItemData,
} from "@repositories/i-raid-loot-repository";

export class RaidLootRepository implements IRaidLootRepository {
    constructor(
        private readonly database: DatabaseClient,
        private readonly logger = createLogger("RaidLootRepository")
    ) {}

    async upsertItem(item: RaidLootItemData): Promise<void> {
        this.logger.info("Upserting item into raid_loot_item", {
            itemId: item.id,
        });
        const { error } = await this.database.from("raid_loot_item").upsert(
            {
                id: item.id,
                name: item.name,
                description: item.description,
            },
            { onConflict: "id" }
        );

        if (error) {
            throw new ServiceError({
                message: `Failed to upsert item ${item.id}: ${error.message}`,
                serviceName: "RaidLootRepository",
            });
        }
    }

    async upsertBoss(name: string): Promise<{ id: string; name: string }> {
        this.logger.info("Upserting boss", { bossName: name });
        const { data, error } = await this.database
            .from("bosses")
            .upsert({ name }, { onConflict: "name" })
            .select("id, name")
            .single();

        if (error || !data) {
            throw new ServiceError({
                message: `Failed to upsert boss "${name}": ${error?.message}`,
                serviceName: "RaidLootRepository",
            });
        }

        return data as { id: string; name: string };
    }

    async linkItemToBoss(itemId: number, bossId: string): Promise<void> {
        this.logger.info("Linking item to boss", { itemId, bossId });
        const { error } = await this.database
            .from("bosses_items")
            .upsert(
                { item_id: itemId, boss_id: bossId },
                { onConflict: "item_id,boss_id" }
            );

        if (error) {
            throw new ServiceError({
                message: `Failed to link item ${itemId} to boss: ${error.message}`,
                serviceName: "RaidLootRepository",
            });
        }
    }

    async linkItemToRaid(itemId: number, raidId: string): Promise<void> {
        this.logger.info("Linking item to raid", { itemId, raidId });
        const { error } = await this.database
            .from("raid_loot")
            .upsert(
                { raid_id: raidId, item_id: itemId },
                { onConflict: "item_id,raid_id" }
            );

        if (error) {
            throw new ServiceError({
                message: `Failed to link item ${itemId} to raid: ${error.message}`,
                serviceName: "RaidLootRepository",
            });
        }
    }

    async getRaids(): Promise<Raid[]> {
        this.logger.info("Fetching all raids");
        const { data, error } = await this.database
            .from("ev_raid")
            .select(
                "id, name, min_level, created_at, image, reservation_amount, short_name, min_gs, size"
            );

        if (error) {
            throw new ServiceError({
                message: `Failed to fetch raids: ${error.message}`,
                serviceName: "RaidLootRepository",
            });
        }

        return (data || []) as Raid[];
    }
}
