import { IBlizzardItemService, BlizzardItemDetails } from "src/domain/services/i-blizzard-item-service";
import { getEnvironment } from "../environment";

const VERSION = ''

export class BlizzardItemService implements IBlizzardItemService {
    private readonly apiBaseUrl: string;
    private readonly namespace: string;
    private readonly locale: string;

    constructor() {
        const { blizzardRegion, blizzardLocale, classicStaticNamespace } = getEnvironment();
        this.apiBaseUrl = `https://${blizzardRegion}.api.blizzard.com`;
        this.namespace = classicStaticNamespace.replace(/static-/, `static-${VERSION}`);
        this.locale = blizzardLocale;
    }

    async fetchItemDetails(token: string, itemId: number, fetchUrl?: string): Promise<BlizzardItemDetails> {
        const url = fetchUrl ?? this.createItemUrl(itemId);

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(
                `BlizzardItemService::fetchItemDetails - Failed to fetch item ${itemId}: ${response.status} ${response.statusText} try with: ${url} and token: ${token}`,
            );
        }

        const data = await response.json() as {
            level?: number;
            quality?: {
                type?: string;
                name?: string;
            };
        };

        const itemLevel = data.level ?? 0;
        const qualityType = data.quality?.type ?? "COMMON";
        const qualityName = data.quality?.name ?? "Common";

        return {
            itemLevel,
            quality: {
                type: qualityType,
                name: qualityName,
            },
        };
    }

    private createItemUrl(itemId: number): string {
        return `${this.apiBaseUrl}/data/wow/item/${itemId}?namespace=${this.namespace}&locale=${this.locale}`;
    }
}
