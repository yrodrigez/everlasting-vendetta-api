import { DatabaseClient } from "@database/database-client-factory";
import { RaidResetsPort } from "src/application/ports/raid-resets/raid-resets.port";

export class RaidResetsRepository implements RaidResetsPort {
    constructor(
        private readonly databaseClient: DatabaseClient // Replace with actual database client type
    ) {}

    async getResetCreatedBy(resetId: string): Promise<{
        id: string;
        raidDate: string;
        time: string;
        createdBy: {
            name: string;
            realmSlug: string;
            id: number;
        };
    }> {
        const { data, error } = await this.databaseClient
            .from("raid_resets")
            .select("id, raid_date, time, created_by:ev_member!created_by(character, id)")
            .eq("id", resetId)
            .single<{
                id: string;
                raid_date: string;
                time: string;
                created_by: {
                    id: number;
                    character: {
                        name: string;
                        realm: { slug: string };
                    };
                };
            }>();

        if (error) {
            throw new Error(
                `Failed to fetch raid reset with ID ${resetId}: ${error.message}`
            );
        }

        
        if (!data) {
            throw new Error(`Raid reset with ID ${resetId} not found`);
        }

        return {
            id: data.id,
            raidDate: data.raid_date,
            time: data.time,
            createdBy: {
                name: data.created_by.character.name,
                realmSlug: data.created_by.character.realm.slug,
                id: data.created_by.id,
            },
        };
    }
}
