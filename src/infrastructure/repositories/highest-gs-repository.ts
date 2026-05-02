import type { DatabaseClient } from "@database/database-client-factory";
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

export class HighestGSRepository implements HighestGSPort {
    constructor(private readonly databaseClient: DatabaseClient) { }

    async getHighestGS(
        characterName: string,
        realmSlug: string
    ): Promise<HighestGS | null> {
        const { data, error } = await this.databaseClient
            .from("highest_gs")
            .select(
                "character_name, realm_slug:character_realm, created_at, updated_at, details"
            )
            .eq("character_name", this.normalize(characterName))
            .eq("character_realm", this.normalize(realmSlug))
            .maybeSingle();


        if (error) {
            throw new Error(
                `Error fetching highest GS for ${characterName} on ${realmSlug}: ${error.message}`
            );
        }

        if (!data) {
            return null;
        }

        return this.toHighestGS(data as HighestGSRow);
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

        return this.toHighestGS(data as HighestGSRow);
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

    private normalize(value: string): string {
        return value.trim().toLowerCase();
    }
}
