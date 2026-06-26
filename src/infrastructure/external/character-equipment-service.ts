import type {
    CharacterEquipment,
    ICharacterEquipmentService,
} from "@repositories/gearscore/i-character-equipment-service.ts";
import { BlizzardApiError } from "../../domain/errors/blizzard-api-error.ts";
import { findNamespace } from "@infrastructure/environment.ts";
import { createLogger } from "@infrastructure/logging/index.ts";

const LOCALE = "en_US";

export class CharacterEquipmentService implements ICharacterEquipmentService {
    private readonly baseUrl = "https://eu.api.blizzard.com";
    private readonly logger = createLogger("CharacterEquipmentService");

    async fetchEquipment(
        characterName: string,
        realm: string,
        token: string
    ): Promise<CharacterEquipment> {
        this.logger.info(
            `Fetching equipment for ${characterName} on ${realm}...`
        );
        if (!characterName) {
            this.logger.error(
                "CharacterEquipmentService::fetchEquipment - characterName parameter is required"
            );
            throw new BlizzardApiError(
                "CharacterEquipmentService::fetchEquipment - characterName parameter is required"
            );
        }

        const url = `${this.baseUrl}/profile/wow/character/${realm}/${encodeURIComponent(characterName)}/equipment`;
        const namespace = findNamespace(realm, "profile");
        if (!namespace) {
            this.logger.error(
                `CharacterEquipmentService::fetchEquipment - Namespace not found for realm: ${realm}`
            );
            throw new Error(`Namespace not found for realm: ${realm}`);
        }
        const query = new URLSearchParams({
            locale: LOCALE,
            namespace,
        });

        const response = await fetch(`${url}?${query}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const text = await response.text();
            this.logger.error(
                `CharacterEquipmentService::fetchEquipment - Error fetching equipment (${url}): ${text ?? "Unknown error"} ${response.status} ${response.statusText} token: ${token}`
            );
            throw new BlizzardApiError(
                `CharacterEquipmentService::fetchEquipment - Error fetching equipment (${url}): ${text ?? "Unknown error"} ${response.status} ${response.statusText} token: ${token}`
            );
        }

        const data = (await response.json()) as any;

        this.logger.info(
            `CharacterEquipmentService::fetchEquipment - Successfully fetched equipment for ${characterName} on ${realm}`
        );

        const equippedItems = (data?.equipped_items ?? []).map((item: any) => {
            const url = item?.item?.key?.href as string;
            let fetchUrl: URL | undefined = undefined;
            if (url) {
                fetchUrl = new URL(url);
                fetchUrl.searchParams.set("locale", LOCALE);
            }

            const gems = item?.enchantments
                ?.filter(
                    (e: any) =>
                        !e.enchantment_slot?.type && e.enchantment_slot?.id > 0
                )
                .map((enchantment: any) => {
                    const { source_item } = enchantment;
                    const sourceItem = source_item as {
                        key: { href: string };
                        id: any;
                    } | null;
                    const url = sourceItem?.key?.href;
                    let fetchUrl: URL | undefined = undefined;
                    if (url) {
                        fetchUrl = new URL(url);
                        fetchUrl.searchParams.set("locale", LOCALE);
                    }
                    return {
                        id: parseInt(enchantment?.enchantment_id ?? 0, 10),
                        itemId: parseInt(sourceItem?.id ?? 0, 10),
                        displayString: enchantment.display_string,
                        fetchUrl,
                    };
                })
                .filter((gem: any) => gem.itemId > 0);
            return {
                itemId: parseInt(item?.item?.id ?? 0, 10),
                inventoryType: `INVTYPE_${item.inventory_type?.type}`,
                isEnchanted:
                    item.enchantments?.filter(
                        (e: any) => e.enchantment_slot?.type === "PERMANENT"
                    ).length > 0,
                qualityType: (item?.quality?.type ?? "COMMON").toUpperCase(),
                fetchUrl,
                gems,
            };
        });

        this.logger.info(
            `CharacterEquipmentService::fetchEquipment - Processed equipment data for ${characterName} on ${realm}`
        );

        return {
            characterName,
            equippedItems,
        };
    }
}
