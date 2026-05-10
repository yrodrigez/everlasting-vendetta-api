import { WalletPort } from "src/application/ports/evx/wallets.port";

export class FindAllWalletsUseCase {
    constructor(private walletRepository: WalletPort) { }

    async execute() {
        try {
            const wallets = await this.walletRepository.findAll();
            return wallets;
        } catch (error) {
            throw new Error(`Failed to find all wallets: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

}