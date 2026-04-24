import { DatabaseClient } from "@database/database-client-factory";
import {
    RaidResetParticipant,
    RaidResetsParticipantPort,
} from "src/application/ports/raid-resets/reset-participants.port";

export class RaidResetParticipantsRepository
    implements RaidResetsParticipantPort
{
    constructor(
        private readonly databaseClient: DatabaseClient // Replace with actual database client type
    ) {}

    async getParticipantsByResetId(
        resetId: string
    ): Promise<RaidResetParticipant[]> {
        const { data, error } = await this.databaseClient
            .from("ev_raid_participant")
            .select(
                "created_at, updated_at, member_id, raid_id, is_confirmed, details, member:ev_member!inner(user_id, created_at, character, user_id)"
            )
            .eq("raid_id", resetId) // legacy column name, should be renamed to reset_id in the future
            .overrideTypes<
                {
                    created_at: string;
                    updated_at: string;
                    member_id: number;
                    raid_id: string;
                    is_confirmed: boolean;
                    details?: {
                        role:
                            | "tank"
                            | "healer"
                            | "dps"
                            | "tank-dps"
                            | "healer-dps"
                            | "tank-healer";
                        status:
                            | "confirmed"
                            | "tentative"
                            | "declined"
                            | "bench"
                            | "late";
                        className:
                            | "death knight"
                            | "demon hunter"
                            | "druid"
                            | "hunter"
                            | "mage"
                            | "monk"
                            | "paladin"
                            | "priest"
                            | "rogue"
                            | "shaman"
                            | "warlock"
                            | "warrior";
                        rss: number;
                    };
                    member: {
                        user_id: string;
                        created_at: string;
                        character: {
                            name: string;
                            realm: { slug: string };
                        };
                    };
                }[]
            >();

        if (error) {
            throw new Error(
                `Failed to fetch raid participants for reset ID ${resetId}: ${error.message}`
            );
        }

        return data.map((participant) => ({
            characterId: participant.member_id,
            participationCreatedAt: new Date(participant.created_at),
            resetId: participant.raid_id,
            isConfirmed: participant.is_confirmed,
            participationUpdatedAt: new Date(participant.updated_at),
            character: {
                name: participant.member.character.name,
                realmSlug: participant.member.character.realm.slug,
                createdAt: new Date(participant.member.created_at),
                userId: participant.member.user_id,
            },
            details: participant.details
                ? participant.details.rss
                    ? { ...participant.details }
                    : { ...participant.details, rss: 0 }
                : {
                      role: "dps",
                      status: "tentative",
                      className: "mage",
                      rss: 0,
                  },
        }));
    }

    async updateParticipant(participant: RaidResetParticipant): Promise<void> {
        const { error } = await this.databaseClient
            .from("ev_raid_participant")
            .update({
                details: participant.details,
            })
            .eq("member_id", participant.characterId)
            .eq("raid_id", participant.resetId);

        if (error) {
            throw new Error(
                `Failed to update raid participant for reset ID ${participant.resetId}: ${error.message}`
            );
        }
    }
}
