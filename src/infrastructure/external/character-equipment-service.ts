import type {
	CharacterEquipment,
	ICharacterEquipmentService,
} from "@repositories/gearscore/i-character-equipment-service.ts";
import { BlizzardApiError } from "../../domain/errors/blizzard-api-error.ts";

const LOCALE = "en_US";
const NAMESPACE = "profile-classic1x-eu";

export class CharacterEquipmentService implements ICharacterEquipmentService {
	private readonly baseUrl = "https://eu.api.blizzard.com";

	async fetchEquipment(
		characterName: string,
		realm: string,
		token: string,
	): Promise<CharacterEquipment> {
		if (!characterName) {
			throw new BlizzardApiError(
				"CharacterEquipmentService::fetchEquipment - characterName parameter is required",
			);
		}

		const url =
			`${this.baseUrl}/profile/wow/character/${realm}/${encodeURIComponent(characterName)}/equipment`;
		const query = new URLSearchParams({
			locale: LOCALE,
			namespace: NAMESPACE,
		});

		const response = await fetch(`${url}?${query}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const text = await response.text();
			throw new BlizzardApiError(
				`CharacterEquipmentService::fetchEquipment - Error fetching equipment: ${text ?? 'Unknown error'} ${response.status} ${response.statusText} token: ${token}`,
			);
		}

		const data = await response.json() as any;

		const equippedItems = (data?.equipped_items || []).map((item: any) => ({
			itemId: parseInt(item?.item?.id ?? 0, 10),
			inventoryType: `INVTYPE_${item.inventory_type?.type}`,
			isEnchanted:
				item.enchantments?.filter(
					(e: any) => e.enchantment_slot?.type === "PERMANENT",
				).length > 0,
		}));

		return {
			characterName,
			equippedItems,
		};
	}
}
