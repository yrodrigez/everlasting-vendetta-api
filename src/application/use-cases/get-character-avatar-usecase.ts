import { Member } from "@entities/member";
import type { IMemberRepository } from "@repositories/i-member-repository";
import type ITokenRepository from "@repositories/i-token-repository";
import type { IWowCharacterService } from "@repositories/i-wow-character-service";

export interface GetCharacterAvatarInput {
    realmSlug: string;
    characterName: string;
    forceRefresh?: boolean;
}

export interface GetCharacterAvatarOutput {
    avatarUrl: string;
    source: "database" | "blizzard";
    updated: boolean;
}

export class GetCharacterAvatarUseCase {
    constructor(
        private readonly memberRepository: IMemberRepository,
        private readonly tokenRepository: ITokenRepository,
        private readonly characterService: IWowCharacterService
    ) {}

    async execute(
        input: GetCharacterAvatarInput
    ): Promise<GetCharacterAvatarOutput> {
        const realmSlug = input.realmSlug.trim().toLowerCase();
        const characterName = input.characterName.trim();

        const existingMember =
            await this.memberRepository.findByRealmSlugAndName(
                realmSlug,
                characterName
            );

        const storedAvatar = existingMember?.character.avatar ?? null;
        const hasStoredAvatar = Boolean(
            storedAvatar && !storedAvatar.toLowerCase().includes("anon")
        );

        const shouldRefresh =
            input.forceRefresh === true || !existingMember || !hasStoredAvatar;

        if (!shouldRefresh && storedAvatar) {
            return {
                avatarUrl: storedAvatar,
                source: "database",
                updated: false,
            };
        }

        const token = await this.tokenRepository.getCurrentToken();

        const fetchedAvatar = await this.characterService.getCharacterAvatar(
            realmSlug,
            characterName,
            token.access_token
        );

        if (existingMember) {
            if (input.forceRefresh || fetchedAvatar !== storedAvatar) {
                const updatedMember = new Member(
                    existingMember.id,
                    existingMember.userId,
                    existingMember.wowAccountId,
                    {
                        ...existingMember.character,
                        avatar: fetchedAvatar,
                    },
                    existingMember.registrationSource,
                    existingMember.created_at,
                    new Date()
                );

                await this.memberRepository.update(updatedMember);
            }
        }

        return {
            avatarUrl: fetchedAvatar,
            source: "blizzard",
            updated:
                existingMember !== null &&
                (input.forceRefresh === true || fetchedAvatar !== storedAvatar),
        };
    }
}
