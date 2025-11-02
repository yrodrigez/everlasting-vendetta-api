export interface WowItemSpell {
    readonly spellId: number;
    readonly spellName: string;
    readonly description: string;
}

export interface WowItemQuality {
    readonly type: string;
    readonly name: string;
}

export interface WowItemIcons {
    readonly small: string;
    readonly medium: string;
    readonly large: string;
}

export interface WowItemDetails {
    readonly id: number;
    readonly name: string;
    readonly tooltip: string;
    readonly icon: string;
    readonly icons: WowItemIcons;
    readonly level: number;
    readonly quality: WowItemQuality;
    readonly type: string;
    readonly spells: WowItemSpell[];
    readonly qualityName: string;
}
