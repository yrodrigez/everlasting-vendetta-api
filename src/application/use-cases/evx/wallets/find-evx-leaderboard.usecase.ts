import { EVXLeaderboardEntry } from "@dto/evx/wallets";
import { WalletPort } from "src/application/ports/evx/wallets.port";

export class FindEVXLeaderboardUseCase {
    constructor(private readonly walletRepository: WalletPort) {}

    async execute(): Promise<EVXLeaderboardEntry[]> {
        return this.walletRepository.findLeaderboard();
    }
}
