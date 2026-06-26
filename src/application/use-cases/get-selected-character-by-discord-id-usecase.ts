import { IAuthRepository } from "@repositories/i-auth-repository";
import { IMemberRepository } from "@repositories/i-member-repository";
import { Member } from "@entities/member";

export class GetSelectedCharacterByDiscordIdUseCase {
    constructor(
        private readonly authRepository: Pick<
            IAuthRepository,
            "findUserByProviderUserId"
        >,
        private readonly memberRepository: Pick<
            IMemberRepository,
            "findSelectedByUserId"
        >
    ) {}

    async execute(discordId: string): Promise<Member> {
        const oauthProvider =
            await this.authRepository.findUserByProviderUserId(
                discordId,
                "discord_oauth"
            );

        if (!oauthProvider) {
            throw new Error("No user found for the provided Discord ID");
        }

        const selectedCharacter =
            await this.memberRepository.findSelectedByUserId(
                oauthProvider.userId
            );

        if (!selectedCharacter) {
            throw new Error("No selected character found for this user");
        }

        return selectedCharacter;
    }
}
