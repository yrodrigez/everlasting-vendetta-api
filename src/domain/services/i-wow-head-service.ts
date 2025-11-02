import { WowHeadItemOutput } from "@dto/wow-items/wow-head-item-output";

export interface IWoWHeadService {
    fetchItemDetails(itemId: number): Promise<WowHeadItemOutput>;
}