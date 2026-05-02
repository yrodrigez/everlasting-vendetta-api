export interface ItemDetails {
	readonly itemLevel: number;
	readonly quality: {
		readonly type: string;
		readonly name: string;
	};
	readonly icon: string;
	readonly displayId?: number;
	id: number; name: string;
	type?: string;
	icons?: {
		large: string;
		medium: string;
		small: string;
	}
	level?: number;
	tooltip?: string;
	qualityName?: string;
	sockets?: Array<{
		type: string;
	}>;
}


export interface IItemService {
	/**
	 * Fetches item details from cache or external sources
	 */
	getItem(
		itemId: number,
		forceRefresh?: boolean,
	): Promise<ItemDetails>;
}
