import { Window as HappyDomWindow } from 'happy-dom'

const slotToInvType: Record<string, string> = {
    HEAD: 'INVTYPE_HEAD',
    NECK: 'INVTYPE_NECK',
    SHOULDER: 'INVTYPE_SHOULDER',
    CHEST: 'INVTYPE_CHEST',
    ROBE: 'INVTYPE_ROBE',
    WAIST: 'INVTYPE_WAIST',
    LEGS: 'INVTYPE_LEGS',
    FEET: 'INVTYPE_FEET',
    WRIST: 'INVTYPE_WRIST',
    HAND: 'INVTYPE_HAND',
    HANDS: 'INVTYPE_HAND',
    FINGER: 'INVTYPE_FINGER',
    TRINKET: 'INVTYPE_TRINKET',
    CLOAK: 'INVTYPE_CLOAK',
    BACK: 'INVTYPE_CLOAK',
    WEAPON: 'INVTYPE_WEAPON',
    'ONE-HAND': 'INVTYPE_WEAPON',
    'ONE HAND': 'INVTYPE_WEAPON',
    ONEHAND: 'INVTYPE_WEAPON',
    SHIELD: 'INVTYPE_SHIELD',
    OFFHAND: 'INVTYPE_WEAPONOFFHAND',
    'OFF HAND': 'INVTYPE_WEAPONOFFHAND',
    '2HWEAPON': 'INVTYPE_2HWEAPON',
    TWOHWEAPON: 'INVTYPE_TWOHWEAPON',
    'TWO-HAND': 'INVTYPE_2HWEAPON',
    'TWO HAND': 'INVTYPE_2HWEAPON',
    TWOHAND: 'INVTYPE_2HWEAPON',
    WEAPONMAINHAND: 'INVTYPE_WEAPONMAINHAND',
    MAINHAND: 'INVTYPE_WEAPONMAINHAND',
    WEAPONOFFHAND: 'INVTYPE_WEAPONOFFHAND',
    HOLDABLE: 'INVTYPE_HOLDABLE',
    RANGED: 'INVTYPE_RANGED',
    THROWN: 'INVTYPE_THROWN',
    RANGEDRIGHT: 'INVTYPE_RANGEDRIGHT',
    RELIC: 'INVTYPE_RELIC',
    BODY: 'INVTYPE_BODY',
    TABARD: 'INVTYPE_TABARD',
    AMMO: 'INVTYPE_AMMO',
    BAG: 'INVTYPE_BAG'
}

type DomParserLike = {
    parseFromString(html: string, mimeType: string): any
} | null

let cachedDomParser: DomParserLike | undefined

export class WoWHeadParser {
    static parseQuality(quality: number) {
        const qualityMap: Record<number, { name: string; type: string }> = {
            0: { name: 'Poor', type: 'poor' },
            1: { name: 'Common', type: 'common' },
            2: { name: 'Uncommon', type: 'uncommon' },
            3: { name: 'Rare', type: 'rare' },
            4: { name: 'Epic', type: 'epic' },
            5: { name: 'Legendary', type: 'legendary' },
            6: { name: 'Artifact', type: 'artifact' },
            7: { name: 'Heirloom', type: 'heirloom' },
            8: { name: 'WoW Token', type: 'wow-token' },
        };

        return qualityMap[quality] || { name: 'Unknown', type: 'unknown' };
    }
    static parseInventoryType(tooltip: string): string | null {
        if (!tooltip) {
            return null
        }

        const slotFromDom = WoWHeadParser.extractSlotFromDom(tooltip)
        if (slotFromDom) {
            const resolvedFromDom = WoWHeadParser.resolveInventoryType(slotFromDom, tooltip)
            if (resolvedFromDom) {
                return resolvedFromDom
            }
        }

        const slotFromRegex = WoWHeadParser.extractSlotFromHtml(tooltip)
        if (slotFromRegex) {
            return WoWHeadParser.resolveInventoryType(slotFromRegex, tooltip)
        }

        return null
    }

    static parseItemLevel(tooltip: string): number | null {
        if (!tooltip) {
            return null
        }

        const itemLevel = WoWHeadParser.extractItemLevelFromHtml(tooltip)
        return itemLevel
    }

    private static extractSlotFromDom(html: string): string | null {
        const parser = WoWHeadParser.getDomParser()
        if (!parser) {
            return null
        }

        try {
            const doc = parser.parseFromString(html, 'text/html')
            const slotCell = doc?.querySelector?.('table table tr td')
            if (!slotCell) {
                return null
            }

            return slotCell.textContent?.trim()?.toUpperCase() ?? null
        } catch {
            return null
        }
    }

    private static getDomParser(): DomParserLike {
        if (cachedDomParser !== undefined) {
            return cachedDomParser
        }

        const globalDomParser = (globalThis as any).DOMParser
        if (typeof globalDomParser === 'function') {
            try {
                const parserInstance = new globalDomParser() as DomParserLike
                cachedDomParser = parserInstance
                return parserInstance
            } catch {
                // ignore and fall back to happy-dom
            }
        }

        try {
            const happyWindow = new HappyDomWindow()
            const parserInstance = new happyWindow.DOMParser() as DomParserLike
            cachedDomParser = parserInstance
            return parserInstance
        } catch {
            cachedDomParser = null
            return cachedDomParser
        }
    }

    private static extractItemLevelFromHtml(html: string): number | null {
        const match = html.match(/Item\s*Level\s*(?:<!--ilvl-->)?\s*(\d+)/i)
        return match ? parseInt(match[1], 10) : null
    }

    private static extractSlotFromHtml(html: string): string | null {
        const match = html.match(/<td>\s*([^<]+?)\s*<\/td>\s*<th/i)
        if (!match) {
            return null
        }

        return match[1].trim().toUpperCase()
    }

    private static resolveInventoryType(slot: string, html: string): string | null {
        const normalized = slot.replace(/\s+/g, ' ').trim().toUpperCase()
        const compacted = normalized.replace(/[\s-]/g, '')

        if (compacted === 'OFFHAND') {
            if (/>\s*Shield\s*</i.test(html)) {
                return slotToInvType.SHIELD
            }
            return slotToInvType.OFFHAND ?? slotToInvType['OFF HAND'] ?? null
        }

        const directMatch = slotToInvType[normalized] ?? slotToInvType[compacted]
        if (directMatch) {
            return directMatch
        }

        return null
    }
}
