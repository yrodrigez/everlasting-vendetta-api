import { DatabaseClientFactory } from "@database/database-client-factory";
import { AuthRepository } from "@infrastructure/repositories/auth-repository";
import { MemberRepository } from "@infrastructure/repositories/member-repository";
import { GetMyProfileUseCase } from "@use-cases/get-my-profile-usecase";

export class GetMyProfileUseCaseFactory {
    static make(): GetMyProfileUseCase {
        const databaseClient = DatabaseClientFactory.getInstance();

        const authRepository = new AuthRepository(databaseClient);
        const memberRepository = new MemberRepository(databaseClient);

        return new GetMyProfileUseCase(memberRepository, authRepository);
    }
}
