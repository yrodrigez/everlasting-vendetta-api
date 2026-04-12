import { Member } from "@entities/member";
import { WoWCharacter } from "@entities/wow/wow-character";
import { findNamespace } from "@infrastructure/environment";
import { IMemberRepository } from "@repositories/i-member-repository";
import ITokenRepository from "@repositories/i-token-repository";
import { IWowCharacterService } from "@repositories/i-wow-character-service";
import pLimit from "p-limit";
import { IWowGuildService } from "src/domain/services/i-wow-guild-service";
import { createLogger } from "src/infrastructure/logging/logger";

export class GetGuildRosterUseCase {
    private readonly logger = createLogger("GetGuildRosterUseCase");
    private readonly limit = pLimit(5);

    constructor(
        private readonly wowGuildService: IWowGuildService,
        private readonly characterRepository: IMemberRepository,
        private readonly wowCharacterService: IWowCharacterService,
        private readonly tokenRepository: ITokenRepository,
        private readonly realms: { slug: string }[],
        private readonly guildNames: string[],
    ) { }

    async execute(): Promise<WoWCharacter[]> {
        const token = await this.tokenRepository.getCurrentToken();
        const accessToken = token.access_token;
        const guildMembers = (
            await Promise.all(
                this.realms.flatMap(({ slug: realmSlug }) =>
                    this.guildNames.map(async (guildSlug) => {
                        try {

                            const roster = await this.wowGuildService.getGuildRoster(
                                realmSlug,
                                guildSlug,
                                accessToken
                            );
                            return roster.members.map((m) => ({
                                realmSlug: m.realm.slug,
                                name: m.name
                            }))
                        } catch (error) {
                            this.logger.error(
                                `Failed to fetch roster for guild ${guildSlug} on realm ${realmSlug}`,
                                error
                            )
                            return []
                        }
                    })
                )
            )
        ).flat()

        const freshnessWindowMs = 2 * 24 * 60 * 60 * 1000
        const now = Date.now()

        const namesByRealm = this.realms.reduce((acc, { slug: realmSlug }) => {
            acc[realmSlug] = [...new Set(guildMembers.filter(m => m.realmSlug === realmSlug).map(m => m.name))]
            return acc
        }, {} as Record<string, string[]>)

        const storedByKey = new Map<string, Member>()
        await Promise.all(
            this.realms.map(async ({ slug: realmSlug }) => {
                const characterNames = namesByRealm[realmSlug] ?? []
                if (characterNames.length === 0) return

                try {
                    const storedMembers = await this.characterRepository.findAllByRealmSlugAndNames(
                        realmSlug,
                        characterNames
                    )

                    for (const member of storedMembers) {
                        const key = this.key(realmSlug, member.character.name)
                        storedByKey.set(key, member)
                    }
                } catch (error) {
                    this.logger.warn(`Failed to read members from repository on realm ${realmSlug}`)
                }
            })
        )

        const result: WoWCharacter[] = []
        const toFetch: Array<{ realmSlug: string; name: string }> = []

        for (const gm of guildMembers) {
            const key = this.key(gm.realmSlug, gm.name)
            const stored = storedByKey.get(key)

            if (!stored) {
                toFetch.push(gm)
                continue
            }

            const lastUpdated = stored.updated_at ?? stored.created_at
            const isFresh = lastUpdated && now - lastUpdated.getTime() <= freshnessWindowMs

            if (isFresh) {
                result.push(this.memberToWoWCharacter(stored))
            } else {
                if (stored.character.level >= 10) toFetch.push(gm)
                else result.push(this.memberToWoWCharacter(stored))
            }
        }

        const fetched = await this.fetchCharactersWithAvatars(toFetch, accessToken);

        await this.updateFetchedMembers(fetched);

        return [...result, ...fetched]
    }

    private key(realmSlug: string, name: string) {
        return `${realmSlug.trim().toLowerCase()}:${name.trim().toLowerCase()}`
    }

    private async updateFetchedMembers(fetched: WoWCharacter[]): Promise<void> {
        try {
            this.logger.info(`Upserting ${fetched.length} fetched guild roster members into repository`)

            await this.characterRepository.upsertMany(fetched.map(c => {
                return Member.fromWoWCharacter(c, undefined, 0, null, new Date(), new Date())
            }));
        } catch (error) {
            this.logger.error('Failed to upsert fetched guild roster members', error)
        }
    }

    private async fetchCharactersWithAvatars(
        members: Array<{ realmSlug: string; name: string }>,
        accessToken: string
    ): Promise<WoWCharacter[]> {
        const results = await Promise.all(
            members.map((m) =>
                this.limit(async () => {
                    try {
                        return await this.wowCharacterService.getCharacterWithAvatar(
                            m.realmSlug,
                            (m.name.toLowerCase()),
                            accessToken,
                        )
                    } catch (error) {
                        this.logger.error(
                            `Failed to fetch character ${m.name} from Blizzard on realm ${m.realmSlug}`,
                            error
                        )
                        return null
                    }
                })
            )
        )

        return results.filter((x): x is WoWCharacter => x !== null)
    }

    private memberToWoWCharacter(member: Member): WoWCharacter {
        const char = member.character
        const wowCharacter = new WoWCharacter(
            char.id,
            member.wowAccountId,
            char.name,
            char.realm,
            char.level,
            char.last_login_timestamp,
            { name: char.character_class?.name ?? "", id: 0 },
            { name: char.playable_class?.name, id: 0 },
            "",
            char.guild ?? undefined,
            char.avatar
        )

        if (char.selectedRole) wowCharacter.selectedRole = char.selectedRole
        return wowCharacter
    }
}
