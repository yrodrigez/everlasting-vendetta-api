import type { WowUserProfile } from "@entities/wow/wow-user-profile";
import type { IWowAccountService } from "@repositories/i-wow-account-service";
import { IBlizzardOAuthService } from "src/domain/services/i-blizzard-oauth-service";

export class GetBattleNetInfoUseCase {
    constructor(
        private readonly blizzardOAuthService: IBlizzardOAuthService
    ) { }
    async execute(accessToken: string): Promise<any> {
        const {battletag, id} = await this.blizzardOAuthService.getUserInfo(accessToken);
        
    }
}