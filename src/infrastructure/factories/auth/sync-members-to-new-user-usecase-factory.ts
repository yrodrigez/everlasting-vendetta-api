import { DatabaseClientFactory } from "@database/database-client-factory";
import { MemberRepository } from "@infrastructure/repositories/member-repository";
import { SyncMembersToNewUserUseCase } from "@use-cases/sync-members-to-new-user-usecase";

export class SyncMembersToNewUserUseCaseFactory {
    static make() {
        const databaseClient = DatabaseClientFactory.getInstance();
        const memberRepository = new MemberRepository(databaseClient);

        return new SyncMembersToNewUserUseCase(memberRepository);
    }
}
