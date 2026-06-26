import type { WowGuildOutput } from "@dto/wow-guild/wow-guild-output";

export interface IWowGuildService {
    getGuildRoster(
        realmSlug: string,
        guildSlug: string,
        token: string
    ): Promise<WowGuildOutput>;
}
