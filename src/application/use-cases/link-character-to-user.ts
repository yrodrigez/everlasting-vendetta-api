import { ICharacterValidationService } from "@domain/services/i-character-validation-service";
import { Member, MemberCharacter } from "@entities/member";
import { createLogger } from "@infrastructure/logging";
import { IMemberRepository } from "@repositories/i-member-repository";
import ITokenRepository from "@repositories/i-token-repository";

const logger = createLogger('LinkCharacterToUserUseCase');

export class LinkCharacterToUserUseCase {
    constructor(
        private readonly memberRepository: IMemberRepository,
        private readonly characterValidationService: ICharacterValidationService,
        private readonly tokenRepository: ITokenRepository,
    ) { }

    async execute({ userId, characterName, realmSlug }: { userId: string; characterName: string; realmSlug: string; }): Promise<Member[]> {

        const isRealmValid = await this.characterValidationService.validateRealm(realmSlug);
        if (!isRealmValid) {
            throw new Error(`Realm '${realmSlug}' is not allowed.`);
        }
        const bnetToken = await this.tokenRepository.getCurrentToken();
        const character = await this.characterValidationService.validateCharacterExists(realmSlug, characterName, bnetToken.access_token);
        const availability = await this.characterValidationService.isCharacterAvailable(character.id, userId);
        if (!availability.available) {
            throw new Error(`Character '${characterName}' on realm '${realmSlug}' is already linked by another user.`);
        }

        const memberCharacter: MemberCharacter = {
            id: character.id,
            name: character.name,
            realm: {
                id: character.realm.id,
                name: character.realm.name,
                slug: character.realm.slug,
            },
            level: character.level,
            playable_class: character.playable_class,
            character_class: character.character_class,
            guild: character.guild,
            avatar: character.avatar || "/avatar-anon.png",
            last_login_timestamp: character.last_login_timestamp,
            faction: character.faction,
        };

        const newMember = Member.fromWowCharacter(
            memberCharacter,
            userId,
            0, // wow_account_id = 0 for Discord-linked characters
            'discord_oauth'
        );

        await this.memberRepository.upsert(newMember);
        logger.info(`Character ${characterName} linked to user ${userId}`);

        const allLinkedCharacters = await this.memberRepository.findAllByUserId(userId);

        return allLinkedCharacters;
    }
}