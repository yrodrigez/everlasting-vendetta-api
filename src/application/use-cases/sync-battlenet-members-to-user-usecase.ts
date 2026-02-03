import { IBlizzardOAuthService } from "@domain/services/i-blizzard-oauth-service";
import { Member } from "@entities/member";
import { WoWCharacter } from "@entities/wow/wow-character";
import { createLogger } from "@infrastructure/logging";
import { IMemberRepository } from "@repositories/i-member-repository";
import { IRealmsRepository } from "@repositories/i-realms-repository";
import { IWowAccountRepository } from "@repositories/i-wow-account-repository";
import { IWowAccountService } from "@repositories/i-wow-account-service";
import { IWowCharacterService } from "@repositories/i-wow-character-service";

export class SyncBattlenetMembersToUserUsecase {
    private readonly logger = createLogger('SyncBattlenetMembersToUserUsecase');
    constructor(
        private readonly blizzardOAuthService: IBlizzardOAuthService,
        private readonly wowAccountService: IWowAccountService,
        private readonly charactersService: IWowCharacterService,
        private readonly memberRepository: IMemberRepository,
        public readonly wowAccountRepository: IWowAccountRepository,
        public readonly realmsRepository: IRealmsRepository,
    ) { }

    async execute(userId: string, bnetToken: string): Promise<Member[]> {
        const isValid = await this.blizzardOAuthService.checkTokenValidity(bnetToken);
        if (!isValid) {
            throw new Error("Invalid or expired Battle.net access token");
        }

        const { battletag, id } = await this.blizzardOAuthService.getUserInfo(bnetToken);
        await this.wowAccountRepository.upsert({
            id,
            battletag
        });

        const wowAccount = await this.wowAccountService.getWoWAccount(bnetToken);
        const accountCharacters = wowAccount.wow_accounts.reduce((acc, val) => acc.concat(val.characters), [] as WoWCharacter[]);
        const characters = (await Promise.all(
            accountCharacters.map(async (char) => {
                try {
                    if (char.level < 10) {
                        return char;
                    }

                    const character = await this.charactersService.getCharacterWithAvatar(
                        char.realm.slug,
                        char.name,
                        bnetToken,
                    );
                    this.logger.info(`Fetched character ${char.name} on realm ${char.realm.slug} with level ${character.level}`);

                    return character;
                } catch (e) {
                    this.logger.error(`Error fetching character ${char.name} with level on realm ${char.realm.slug}`, e);
                    return char;
                }
            }))).filter(c => Boolean(c) && c?.level >= 10);

        this.logger.info(`User ${userId} has ${characters.length} characters from Battle.net account.`);
        await this.memberRepository.upsertMany(
            characters.map(char => Member.fromWoWCharacter(char, userId, wowAccount.id, 'bnet_oauth', undefined, new Date()))
        );
        const realmSlugs = await this.realmsRepository.getAllowedRealms().then(realms => realms.map(r => r.slug));
        const linkedMembers = await this.memberRepository.findAllByUserId(userId, realmSlugs);

        this.logger.info(`User ${userId} now has ${linkedMembers.length} linked members after sync.`);

        return linkedMembers.filter(m => m.character.realm);
    }
}