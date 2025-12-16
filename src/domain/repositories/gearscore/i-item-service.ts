export interface ItemDetails {
	readonly itemLevel: number;
	readonly quality: {
		readonly type: string;
		readonly name: string;
	};
	readonly icon: string;
}

export interface IItemService {
	/**
	 * Fetches item details from cache or external sources
	 */
	getItem(
		itemId: number,
		token: string,
		forceRefresh?: boolean,
		fetchUrl?: string,
	): Promise<ItemDetails>;
}
