import { Member } from "@entities/member";
import { WoWCharacter } from "@entities/wow/wow-character";
import { IMemberRepository } from "@repositories/i-member-repository";
import { IWowCharacterService } from "@repositories/i-wow-character-service";
import { IWowGuildService } from "src/domain/services/i-wow-guild-service";
import { createLogger } from "src/infrastructure/logging/logger";
import pLimit from "p-limit";

const REALM = ['spineshatter', 'living-flame'];
const GUILD_NAMES = ['everlasting-vendetta'];
export class GetGuildRosterUseCase {
    private readonly logger = createLogger("GetGuildRosterUseCase");
    private readonly limit = pLimit(5);
    constructor(
        private readonly wowGuildService: IWowGuildService,
        private readonly characterRepository: IMemberRepository,
        private readonly wowCharacterService: IWowCharacterService,
    ) { }
    async execute(): Promise<WoWCharacter[]> {
        const characters: WoWCharacter[] = [];

        const guildMembers = (
            await Promise.all(
                REALM.flatMap((realmSlug) =>
                    GUILD_NAMES.map(async (guildSlug) => {
                        try {
                            const roster = await this.wowGuildService.getGuildRoster(
                                realmSlug,
                                guildSlug,
                            );
                            return roster.members.map((member) => ({
                                realmSlug: member.realm.slug,
                                name: member.name,
                            }));
                        } catch (error) {
                            this.logger.error(
                                `Failed to fetch roster for guild ${guildSlug} on realm ${realmSlug}`,
                                error,
                            );
                            return [];
                        }
                    }),
                ),
            )
        ).flat();


        const freshnessWindowMs = 2 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        const rosterCharacters = await Promise.all(
            guildMembers.map(({ realmSlug, name }) =>
                this.limit(async () => {
                    try {
                        const storedMember =
                            await this.characterRepository.findByRealmSlugAndName(
                                realmSlug,
                                name,
                            );

                        if (storedMember) {
                            const lastUpdated =
                                storedMember.updated_at ?? storedMember.created_at;
                            if (
                                lastUpdated &&
                                now - lastUpdated.getTime() <= freshnessWindowMs
                            ) {
                                return this.memberToWoWCharacter(storedMember);
                            }
                        }
                    } catch (error) {
                        this.logger.warn(
                            `Failed to read member ${name} from repository on realm ${realmSlug}`,
                        );
                    }

                    try {
                        return await this.wowCharacterService.getCharacterWithAvatar(
                            realmSlug,
                            encodeURIComponent(name.toLowerCase()),
                        );
                    } catch (error) {
                        this.logger.error(
                            `Failed to fetch character ${name} from Blizzard on realm ${realmSlug}`,
                            error,
                        );
                        return null;
                    }
                }),
            ),
        );

        for (const character of rosterCharacters) {
            if (character) {
                characters.push(character);
            }
        }


        return characters;
    }

    private memberToWoWCharacter(member: Member): WoWCharacter {
        const char = member.character;
        const wowCharacter = new WoWCharacter(
            char.id,
            member.wowAccountId,
            char.name,
            char.realm,
            char.level,
            char.last_login_timestamp,
            {
                name: char.character_class?.name ?? "",
                id: 0,
            },
            {
                name: char.playable_class?.name,
                id: 0,
            },
            char.guild,
            char.avatar,
        );

        if (char.selectedRole) {
            wowCharacter.selectedRole = char.selectedRole;
        }

        return wowCharacter;
    }
}
