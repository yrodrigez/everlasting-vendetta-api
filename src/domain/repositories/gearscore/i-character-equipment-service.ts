export interface CharacterEquipment {
	readonly characterName: string;
	readonly equippedItems: Array<{
		readonly itemId: number;
		readonly inventoryType: string;
		readonly isEnchanted: boolean;
		readonly qualityType: string;
		readonly fetchUrl: string;
		readonly gems: Array<{
			readonly id: number;
			readonly itemId: number;
			readonly fetchUrl: string;
			readonly displayString: string;
		}>;
	}>;
}

export interface ICharacterEquipmentService {
	/**
	 * Fetches equipment for a character from Blizzard API
	 */
	fetchEquipment(
		characterName: string,
		realm: string,
		token: string,
	): Promise<CharacterEquipment>;
}
