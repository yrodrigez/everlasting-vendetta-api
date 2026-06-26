import { WalletPort } from "src/application/ports/evx/wallets.port";

export class CreateNewWalletUseCase {
    constructor(private readonly walletPort: WalletPort) {}

    async execute(userId: string) {
        const newWallet = await this.walletPort.create({
            userId,
        });
        return newWallet;
    }
}
