export interface WowHeadItemOutput {
    icon: string;
    qualityName: string;
    quality: number;
    name: string;
    id: number;
    tooltip: string;
    spells: Array<{
        spellId: number;
        spellName: string;
        description: string;
    }>;
    icons: {
        small: string;
        medium: string;
        large: string;
    };
    level: number;
    type: string;
}
