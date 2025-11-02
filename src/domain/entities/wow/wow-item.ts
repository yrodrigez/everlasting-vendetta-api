export class WowItem {
    readonly iconUrl: string;
    readonly id: number;
    readonly name: string;
    readonly type: string;
    readonly quality: {
        name: string;
        type: string;
    }
    readonly itemLevel: number;
    readonly stats: Array<{ type: string; value: number }>
    readonly tooltip: string;

    constructor({
        iconUrl,
        id,
        name,
        type,
        quality,
        itemLevel,
        stats,
        tooltip,
    }: {
        iconUrl: string;
        id: number;
        name: string;
        type: string;
        quality: {
            name: string;
            type: string;
        };
        itemLevel: number;
        stats: Array<{ type: string; value: number }>;
        tooltip: string;
    }) {
        this.iconUrl = iconUrl;
        this.id = id;
        this.name = name;
        this.type = type;
        this.quality = quality;
        this.itemLevel = itemLevel;
        this.stats = stats;
        this.tooltip = tooltip;
    }
     
    toJSON() {
        return {
            iconUrl: this.iconUrl,
            id: this.id,
            name: this.name,
            type: this.type,
            quality: this.quality,
            itemLevel: this.itemLevel,
            stats: this.stats,
            tooltip: this.tooltip,
        };
    }
}