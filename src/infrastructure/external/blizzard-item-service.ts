import {
    BlizzardItemDetails,
    IBlizzardItemService,
} from "src/domain/services/i-blizzard-item-service";

export class BlizzardItemService implements IBlizzardItemService {
    private readonly apiBaseUrl: string;

    constructor(
        private readonly locale: string,
        private readonly region: string
    ) {
        this.apiBaseUrl = `https://${this.region}.api.blizzard.com`;
    }

    async fetchItemDetails(
        token: string,
        itemId: number,
        namespace: string,
        fetchUrl?: string
    ): Promise<BlizzardItemDetails> {
        const url = fetchUrl ?? this.createItemUrl(itemId, namespace);

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(
                `BlizzardItemService::fetchItemDetails - Failed to fetch item ${itemId}: ${response.status} ${response.statusText} try with: ${url} and token: ${token}`
            );
        }

        const data = (await response.json()) as {
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

    private createItemUrl(itemId: number, namespace: string): string {
        return `${this.apiBaseUrl}/data/wow/item/${itemId}?namespace=${namespace}&locale=${this.locale}`;
    }
}
