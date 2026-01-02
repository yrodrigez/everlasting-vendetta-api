import { IAuthRepository } from "@repositories/i-auth-repository";
import { IMemberRepository } from "@repositories/i-member-repository";

export class GetMyProfileUseCase {
    constructor(
        private readonly memberRepository: IMemberRepository,
        private readonly authRepository: IAuthRepository,
    ) { }
    async execute(userId: string) {
        const members = await this.memberRepository.findAllByUserId(userId);
        const authProviders = await this.authRepository.findAllByUserId(userId);

        return {
            members: members.map(member => member.toJSON()),
            accounts: authProviders,
        };
    }
}