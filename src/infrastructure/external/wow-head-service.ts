import { WowHeadItemOutput } from "@dto/wow-items/wow-head-item-output";
import { IWoWHeadService } from "src/domain/services/i-wow-head-service";
import { WoWHeadParser } from "./wow-head-parser";

export class WoWHeadService implements IWoWHeadService {
    constructor() {}

    async fetchItemDetails(
        itemId: number,
        env: number = 4
    ): Promise<WowHeadItemOutput> {
        const url = `https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=${env}&locale=0`;
        const response = await fetch(url, {
            headers: {
                Accept: "application/json",
                "Cache-Control": "max-age=86400", // 24 hour cache
            },
        });

        if (!response.ok && env === 4) {
            // retry with 5 for TBC items
            return this.fetchItemDetails(itemId, 5);
        }

        if (!response.ok) {
            throw new Error(
                `WoWHeadService::fetchItemDetails - Error fetching item details for itemId ${itemId}: ${response.status} ${response.statusText}`
            );
        }

        const data = (await response.json()) as {
            name: string;
            quality: number;
            icon: string;
            tooltip: string;
            spells: any[];
        };

        if (!data) {
            throw new Error(
                `WoWHeadService::fetchItemDetails - Invalid data received from WoWHead for itemId ${itemId}`
            );
        }

        const itemLevel = WoWHeadParser.parseItemLevel(data.tooltip);
        const type = WoWHeadParser.parseInventoryType(data.tooltip);
        const quality = WoWHeadParser.parseQuality(data.quality);

        return {
            id: itemId,
            name: data.name,
            icon: `https://wow.zamimg.com/images/wow/icons/medium/${data.icon}.jpg`,
            icons: {
                small: `https://wow.zamimg.com/images/wow/icons/small/${data.icon}.jpg`,
                medium: `https://wow.zamimg.com/images/wow/icons/medium/${data.icon}.jpg`,
                large: `https://wow.zamimg.com/images/wow/icons/large/${data.icon}.jpg`,
            },
            qualityName: quality.name,
            quality: data.quality,
            tooltip: data.tooltip,
            level: itemLevel ?? 0,
            type: type ?? "Unknown",
            spells: (data.spells ?? []).map?.((spell) => ({
                spellId: spell.id as number,
                spellName: spell.name as string,
                description: spell.description as string,
            })),
        };
    }
}
