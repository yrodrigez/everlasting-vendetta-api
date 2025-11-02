export interface BlizzardItemDetails {
    readonly itemLevel: number;
    readonly quality: {
        readonly type: string;
        readonly name: string;
    };
}

export interface IBlizzardItemService {
    fetchItemDetails(token: string, itemId: number): Promise<BlizzardItemDetails>;
}
