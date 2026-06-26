import type { DatabaseClient } from "@database/database-client-factory";
import type { StorePort } from "src/application/ports/store/store.port";
import type {
    HighestGS,
    HighestGSPort,
} from "src/application/ports/gear-score/highest-gs.port";

type HighestGSRow = {
    character_name: string;
    realm_slug: string;
    created_at: string;
    updated_at: string;
    details: HighestGS["details"];
};

const CACHE_TTL_SECONDS = 5 * 60;
export class HighestGSRepository implements HighestGSPort {
    constructor(
        private readonly databaseClient: DatabaseClient,
        private readonly store?: StorePort
    ) {}

    async getHighestGS(
        characterName: string,
        realmSlug: string,
        forceRefresh?: boolean
    ): Promise<HighestGS | null> {
        const normalizedCharacterName = this.normalize(characterName);
        const normalizedRealmSlug = this.normalize(realmSlug);
        const cacheKey = this.getCacheKey(
            normalizedCharacterName,
            normalizedRealmSlug
        );

        if (!forceRefresh) {
            const cached = await this.getFromCache(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const { data, error } = await this.databaseClient
            .from("highest_gs")
            .select(
                "character_name, realm_slug:character_realm, created_at, updated_at, details"
            )
            .eq("character_name", normalizedCharacterName)
            .eq("character_realm", normalizedRealmSlug)
            .maybeSingle();

        if (error) {
            throw new Error(
                `Error fetching highest GS for ${characterName} on ${realmSlug}: ${error.message}`
            );
        }

        if (!data) {
            return null;
        }

        const highestGS = this.toHighestGS(data as HighestGSRow);
        await this.setCache(cacheKey, highestGS);

        return highestGS;
    }

    async saveHighestGS(gs: HighestGS): Promise<HighestGS> {
        const characterName = this.normalize(gs.characterName);
        const realmSlug = this.normalize(gs.realmSlug);
        const { data, error } = await this.databaseClient
            .from("highest_gs")
            .upsert(
                {
                    character_name: characterName,
                    character_realm: realmSlug,
                    details: gs.details,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "character_name,character_realm" }
            )
            .select(
                "character_name, realm_slug:character_realm, created_at, updated_at, details"
            )
            .maybeSingle();

        if (error) {
            throw new Error(
                `Error saving highest GS for ${gs.characterName} on ${gs.realmSlug}: ${error.message}`
            );
        }

        if (!data) {
            throw new Error(
                `Error saving highest GS for ${gs.characterName} on ${gs.realmSlug}: no data returned`
            );
        }

        const highestGS = this.toHighestGS(data as HighestGSRow);
        await this.setCache(
            this.getCacheKey(characterName, realmSlug),
            highestGS
        );

        return highestGS;
    }

    private async getFromCache(cacheKey: string): Promise<HighestGS | null> {
        if (!this.store) {
            return null;
        }

        try {
            const cached = await this.store.get<HighestGS>(cacheKey);
            return cached ? this.toHighestGSFromCache(cached) : null;
        } catch {
            return null;
        }
    }

    private async setCache(
        cacheKey: string,
        highestGS: HighestGS
    ): Promise<void> {
        if (!this.store) {
            return;
        }

        try {
            await this.store.set(cacheKey, highestGS, CACHE_TTL_SECONDS);
        } catch {
            return;
        }
    }

    private toHighestGS(row: HighestGSRow): HighestGS {
        return {
            characterName: row.character_name,
            realmSlug: row.realm_slug,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            details: row.details,
        };
    }

    private toHighestGSFromCache(highestGS: HighestGS): HighestGS {
        return {
            ...highestGS,
            createdAt: new Date(highestGS.createdAt),
            updatedAt: new Date(highestGS.updatedAt),
        };
    }

    private getCacheKey(characterName: string, realmSlug: string): string {
        return `highest-gs:${realmSlug}:${characterName}`;
    }

    private normalize(value: string): string {
        return value.trim().toLowerCase();
    }
}
