import BlizzardApi from "./blizzard-api";
import type { IWowGuildService } from "src/domain/services/i-wow-guild-service";
import type { WowGuildOutput } from "@dto/wow-guild/wow-guild-output";
import { getEnvironment } from "../environment";
import { BlizzardApiError } from "src/domain/errors/blizzard-api-error.ts";

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
    }>;
};

export class WowGuildService extends BlizzardApi implements IWowGuildService {
    private readonly namespace: string;

    constructor(token: string) {
        super(token);
        const { classicProfileNamespace } = getEnvironment();
        this.namespace = classicProfileNamespace;
    }

    async getGuildRoster(
        realmSlug: string,
        guildSlug: string,
    ): Promise<WowGuildOutput> {
        const normalizedRealm = realmSlug.trim().toLowerCase();
        const normalizedGuild = guildSlug.trim().toLowerCase();

        const url = this.createUrl(
            `/data/wow/guild/${encodeURIComponent(normalizedRealm)}/${encodeURIComponent(normalizedGuild)}/roster`,
            { namespace: this.namespace },
        );

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${this.token}`,
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
