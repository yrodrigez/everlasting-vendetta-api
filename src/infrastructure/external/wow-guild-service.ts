import type { WowGuildOutput } from "@dto/wow-guild/wow-guild-output";
import { BlizzardApiError } from "src/domain/errors/blizzard-api-error.ts";
import type { IWowGuildService } from "src/domain/services/i-wow-guild-service";
import BlizzardApi from "./blizzard-api";
import { findNamespace } from "@infrastructure/environment";

type BlizzardGuildRosterResponse = {
    guild?: {
        id?: number;
        name?: string;
        realm?: {
            id?: number;
            name?: string;
            slug?: string;
        };
        faction?: {
            name?: string;
            type?: string;
        };
    };
    members?: Array<{
        character?: {
            key?: {
                href?: string;
            };
            name?: string;
            realm?: {
                id?: number;
                name?: string;
                slug?: string;
            };
        };
        rank: number;
    }>;
};

export class WowGuildService extends BlizzardApi implements IWowGuildService {

    private rankNumberToNameMap(rank: number): { id: number, name: string, isAlt: boolean } {
        const rankNames = [
            'GUILD_MASTER',
            'RAID_LEADER',
            'RESP_COMRADE',
            'RESP_VETERAN',
            'RESP_RAIDER',
            'OFFICER_ALT',
            'BANNED',
            'SOCIAL',
            'ALTER',
            'MEMBER',
        ]

        const name = rankNames[rank] || `RANK_${rank}`;
        const isAlt = name.toLowerCase().includes('alt');
        return { id: rank, name, isAlt };
    };

    async getGuildRoster(
        realmSlug: string,
        guildSlug: string,
        token: string,
    ): Promise<WowGuildOutput> {
        const normalizedRealm = realmSlug.trim().toLowerCase();
        const normalizedGuild = guildSlug.trim().toLowerCase();
        const namespace = findNamespace(realmSlug, 'profile')
        if (!namespace) {
            throw new Error(`Namespace not found for realm: ${realmSlug}`);
        }

        const url = this.createUrl(
            `/data/wow/guild/${encodeURIComponent(normalizedRealm)}/${encodeURIComponent(normalizedGuild)}/roster`,
            { namespace },
        );

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new BlizzardApiError(
                `Error fetching guild roster: ${response.status} - ${text}`,
            );
        }

        const data = await response.json() as BlizzardGuildRosterResponse;

        const guildRealm = data.guild?.realm;
        const baseRealm = {
            id: guildRealm?.id ?? 0,
            name: guildRealm?.name ?? normalizedRealm,
            slug: guildRealm?.slug ?? normalizedRealm,
        };

        const faction = normalizeFaction(
            data.guild?.faction?.name ?? data.guild?.faction?.type,
        );

        const members = (data.members ?? []).map((entry) => {
            const characterRealm = entry.character?.realm;
            const rank = this.rankNumberToNameMap(entry.rank ?? 9);
            return {
                key: {
                    href: entry.character?.key?.href ?? "",
                },
                name: entry.character?.name ?? "",
                realm: {
                    id: characterRealm?.id ?? baseRealm.id,
                    name: characterRealm?.name ?? baseRealm.name,
                    slug: characterRealm?.slug ?? baseRealm.slug,
                },
                rank,
            };
        });

        return {
            id: String(data.guild?.id ?? ""),
            name: data.guild?.name ?? "",
            realm: baseRealm,
            faction,
            membersCount: members.length,
            members,
        };
    }
}

function normalizeFaction(
    factionName?: string,
): "Alliance" | "Horde" {
    const normalized = factionName?.toLowerCase() ?? "";
    if (normalized.includes("horde")) {
        return "Horde";
    }
    return "Alliance";
}
