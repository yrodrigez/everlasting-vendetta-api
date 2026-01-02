import { GetMyProfileUseCase } from "@use-cases/get-my-profile-usecase";

export class GetMyProfileController {

    constructor(
        private readonly getMyProfileUseCase: GetMyProfileUseCase,
    ) { }
    async handle(request: { userId: string }): Promise<any> {
        const userId = request.userId;

        const profile = await this.getMyProfileUseCase.execute(userId);

        return profile;
    }
}