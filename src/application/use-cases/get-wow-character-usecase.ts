import type { IMemberRepository } from "@repositories/i-member-repository";
import type ITokenRepository from "@repositories/i-token-repository";
import type { IWowCharacterService } from "@repositories/i-wow-character-service";
import { Member, type MemberCharacter } from "@entities/member.ts";
import { WoWCharacter } from "@entities/wow/wow-character.ts";
import { createLogger } from "src/infrastructure/logging/index.ts";

export interface GetWowCharacterInput {
    realmSlug: string;
    characterName: string;
    forceRefresh?: boolean;
}

export interface GetWowCharacterOutput {
    character: WoWCharacter;
    source: "database" | "blizzard";
    updated: boolean;
}

type CharacterServiceFactory = (accessToken: string) => IWowCharacterService;

const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

export class GetWowCharacterUseCase {
    private readonly logger = createLogger("GetWowCharacterUseCase");

    constructor(
        private readonly memberRepository: IMemberRepository,
        private readonly tokenRepository: ITokenRepository,
        private readonly characterServiceFactory: CharacterServiceFactory,
    ) { }

    async execute(input: GetWowCharacterInput): Promise<GetWowCharacterOutput> {
        const realmSlug = input.realmSlug.trim().toLowerCase();
        const characterName = input.characterName.trim();

        this.logger.info("Fetching character", {
            realmSlug,
            characterName,
            forceRefresh: input.forceRefresh === true,
        });

        const existingMember =
            await this.memberRepository.findByRealmSlugAndName(
                realmSlug,
                characterName,
            );

        if (
            existingMember &&
            !input.forceRefresh &&
            this.isCacheValid(existingMember)
        ) {
            this.logger.info("Serving character from cache", {
                characterId: existingMember.id,
            });

            return {
                character: this.mapMemberToCharacter(existingMember),
                source: "database",
                updated: false,
            };
        }

        const token = await this.tokenRepository.getCurrentToken();
        const characterService = this.characterServiceFactory(
            token.access_token,
        );
        const fetchedCharacter = await characterService.getCharacterWithAvatar(
            realmSlug,
            characterName,
        );

        let updated = false;


        const updatedMemberCharacter = this.mapWowCharacterToMemberCharacter(
            fetchedCharacter,
            existingMember?.character.selectedRole,
        );
        const hasChanges = this.hasCharacterChanged(
            existingMember?.character ?? {} as MemberCharacter,
            updatedMemberCharacter,
        );

        if (input.forceRefresh === true || hasChanges) {
            const updatedMember = new Member(
                existingMember?.id ?? fetchedCharacter.id,
                existingMember?.userId ?? undefined,
                existingMember?.wowAccountId ?? 0,
                updatedMemberCharacter,
                existingMember?.registrationSource ?? "unknown",
                existingMember?.created_at ?? new Date(),
                new Date(),
            );

            await this.memberRepository.upsert(updatedMember);
            updated = true;
        }


        return {
            character: fetchedCharacter,
            source: "blizzard",
            updated,
        };
    }

    private isCacheValid(member: Member): boolean {
        if (!member.updated_at) {
            return false;
        }

        const age = Date.now() - member.updated_at.getTime();
        return age < CACHE_TTL_MS;
    }

    private mapMemberToCharacter(member: Member): WoWCharacter {
        const char = member.character;

        return new WoWCharacter(
            char.id,
            member.wowAccountId,
            char.name,
            char.realm,
            char.level,
            char.last_login_timestamp,
            {
                id: 0,
                name: char.character_class.name ?? "",
            },
            {
                id: 0,
                name: char.playable_class?.name ?? "",
            },
            char.guild,
            char.avatar,
        );
    }

    private mapWowCharacterToMemberCharacter(
        character: WoWCharacter,
        selectedRole?: string,
    ): MemberCharacter {
        return {
            id: character.id,
            name: character.name,
            realm: character.realm,
            level: character.level,
            playable_class: {
                name:
                    character.playable_class?.name ??
                    character.character_class.name,
            },
            character_class: {
                name: character.character_class.name,
            },
            guild: character.guild,
            avatar: character.avatar ?? "/avatar-anon.png",
            last_login_timestamp: character.last_login_timestamp,
            selectedRole,
        };
    }

    private hasCharacterChanged(
        current: MemberCharacter,
        next: MemberCharacter,
    ): boolean {
        return JSON.stringify(current) !== JSON.stringify(next);
    }
}
