import { Media, Realm } from "./wow-base";

export type Character = {
    name: string;
    id: number;
    realm: Realm;
}

export type PlayableRace = {
    id: number;
    name: string;
}

export type PlayableClass = {
    id: number;
    name: 'Warrior' | 'Paladin' | 'Hunter' | 'Rogue' | 'Priest' | 'Death Knight' | 'Shaman' | 'Mage' | 'Warlock' | 'Monk' | 'Druid' | 'Demon Hunter';
}

export type CharacterGender = {
    type: "MALE" | "FEMALE";
    name: "Male" | "Female";
}

export type CharacterFaction = {
    type: "ALLIANCE" | "HORDE";
    name: "Alliance" | "Horde";
}

export type GuildCrest = {
    emblem: {
        id: number;
        media: Media;
        color: {
            id: number;
        }
    };
    border: {
        id: number;
        media: Media;
        color: {
            id: number;
        }
    }
    background: {
        color: {
            id: number;
        }
    }
}

export type AppearanceItem = {
    id: number;
    slot: {
        type: string;
        name: string;
    };
    internal_slot_id: number;
}

export type CustomzationOption = {
    id: number;
    name: string;
}

export type CustomizationChoice = {
    id: number;
    display_order: number;
}

export type CharacterAppearance = {
    character: Character;
    customaizations: {
        option: CustomzationOption;
        choice: CustomizationChoice;
    }[];
    faction: CharacterFaction;
    gender: CharacterGender;
    guild_crest: GuildCrest;
    items: AppearanceItem[]
    playable_class: PlayableClass;
    playable_race: PlayableRace;
}