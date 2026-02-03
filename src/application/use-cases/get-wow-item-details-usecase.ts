import { IItemService } from "@repositories/gearscore/i-item-service";
import type { WowItemDetails } from "src/domain/entities/wow/wow-item-details";
import type ITokenRepository from "src/domain/repositories/i-token-repository";


export interface GetWowItemDetailsInput {
    itemId: number;
    forceRefresh?: boolean;
}

export interface GetWowItemDetailsOutput {
    itemIconUrl: string | null;
    itemDetails: WowItemDetails;
    displayId: number | null;
}

export class GetWowItemDetailsUseCase {
    constructor(
        private readonly itemService: IItemService,
        private readonly tokenRepository: ITokenRepository,
    ) { }

    async execute(input: GetWowItemDetailsInput): Promise<GetWowItemDetailsOutput> {
        const { itemId, forceRefresh } = input;

        const item = await this.itemService.getItem(
            itemId,
            forceRefresh,
        );


        return {
            itemIconUrl: item.icon,
            itemDetails: (item as unknown as WowItemDetails),
            displayId: item.displayId || null,
        };
    }

}
