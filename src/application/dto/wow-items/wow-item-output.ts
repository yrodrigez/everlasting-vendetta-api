export interface WowItemOutput {
    itemIconUrl: string;
    itemDetails: {
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
        qualityName: string;
        icon: string;
    };
}
