import { Member } from "@entities/member";
import { IMemberRepository } from "@repositories/i-member-repository";

export class SyncMembersToNewUserUseCase {
    constructor(private readonly memberRepository: IMemberRepository) {}
    async execute(userId: string, oldUserId: string): Promise<Member[]> {
        const members = await this.memberRepository.findAllByUserId(oldUserId);

        for (const member of members) {
            member.userId = userId;
        }

        await this.memberRepository.upsertMany(members);

        const membersAfterSync =
            await this.memberRepository.findAllByUserId(userId);

        return membersAfterSync;
    }
}
