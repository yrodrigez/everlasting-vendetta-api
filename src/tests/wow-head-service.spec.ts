import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

jest.mock('happy-dom', () => {
    class DOMParserMock {
        parseFromString(html: string, mimeType: string) {
            if (mimeType !== 'text/html') {
                return { querySelector: () => null }
            }

            return {
                querySelector: (selector: string) => {
                    if (selector !== 'table table tr td') {
                        return null
                    }

                    const match = html.match(/<td>\s*([^<]+?)\s*<\/td>\s*<th/i)
                    if (match) {
                        return { textContent: match[1] }
                    }

                    const fallback = html.match(/>\s*(Hands|Off Hand|Back|Cloak|One-Hand|Main Hand|Body)\s*</i)
                    if (fallback) {
                        return { textContent: fallback[1] }
                    }

                    return null
                },
            }
        }
    }

    class Window {
        readonly DOMParser = DOMParserMock
    }

    return { Window }
})

import { WoWHeadService } from '../infrastructure/external/wow-head-service'

const mockFetch: any = jest.fn()

describe('WoWHeadService', () => {
    let service: WoWHeadService

    beforeEach(() => {
        mockFetch.mockReset()
        ;(globalThis as any).fetch = mockFetch
        service = new WoWHeadService()
    })

    afterEach(() => {
        delete (globalThis as any).fetch
    })

    describe('fetchItemDetails', () => {
        it('maps the response payload to WowHeadItemOutput', async () => {
            const tooltip = `
                <table>
                    <tr>
                        <td>Cloak</td>
                        <th>Back</th>
                    </tr>
                </table>
                Item Level 210
            `

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => ({
                    name: 'Featherskin Drape',
                    quality: 4,
                    icon: 'inv_cape_raidpriest_c_01',
                    tooltip,
                    spells: [
                        {
                            id: 123,
                            name: 'Feather Touch',
                            description: 'Does something fancy',
                        },
                    ],
                }),
            })

            const itemId = 220608
            const itemDetails = await service.fetchItemDetails(itemId)

            expect(mockFetch).toHaveBeenCalledWith(
                'https://nether.wowhead.com/tooltip/item/220608?dataEnv=4&locale=0'
            )
            expect(itemDetails).toEqual({
                id: itemId,
                name: 'Featherskin Drape',
                icon: 'https://wow.zamimg.com/images/wow/icons/medium/inv_cape_raidpriest_c_01.jpg',
                icons: {
                    small: 'https://wow.zamimg.com/images/wow/icons/small/inv_cape_raidpriest_c_01.jpg',
                    medium: 'https://wow.zamimg.com/images/wow/icons/medium/inv_cape_raidpriest_c_01.jpg',
                    large: 'https://wow.zamimg.com/images/wow/icons/large/inv_cape_raidpriest_c_01.jpg',
                },
                qualityName: 'Epic',
                tooltip,
                level: 210,
                type: 'INVTYPE_CLOAK',
                spells: [
                    {
                        spellId: 123,
                        spellName: 'Feather Touch',
                        description: 'Does something fancy',
                    },
                ],
            })
        })

        it('falls back to defaults when parser results are null', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => ({
                    name: 'Mysterious Pouch',
                    quality: 99,
                    icon: 'inv_misc_bag_10',
                    tooltip: 'Some tooltip without slot or level',
                    spells: [],
                }),
            })

            const itemDetails = await service.fetchItemDetails(424242)

            expect(itemDetails.level).toBe(0)
            expect(itemDetails.type).toBe('Unknown')
            expect(itemDetails.qualityName).toBe('Unknown')
            expect(itemDetails.spells).toEqual([])
        })

        it('throws when fetch response is not ok', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: async () => ({}),
            })

            await expect(service.fetchItemDetails(99999)).rejects.toThrow(
                /Error fetching item details/
            )
        })

        it('throws when response body is falsy', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => null,
            })

            await expect(service.fetchItemDetails(111)).rejects.toThrow(
                /Invalid data received/
            )
        })

        describe('inventory slot variations', () => {
            const cases = [
                {
                    label: 'Dreadnaught Grips (Hands)',
                    itemId: 236019,
                    icon: 'inv_gauntlets_28',
                    tooltip: `<table><tr><td><!--nstart--><b class="q4">Dreadnaught Grips</b><!--nend--><!--ndstart--><br /><span style="color: #34FDF0">Sanctified</span><!--ndend--><span class="q"><br>Item Level <!--ilvl-->88</span><!--bo--><br>Binds when picked up<!--ue--><table width="100%"><tr><td>Hands</td><th><!--scstart4:4--><span class="q1">Plate</span><!--scend--></th></tr></table><!--rf--><span><!--amr-->615 Armor</span><br><span><!--stat4-->+32 Strength</span><br><span><!--stat7-->+10 Stamina</span><!--ebstats--><!--egstats--><!--eistats--><!--nameDescStats--><!--rs--><!--e--><!--ps--><br>Durability 55 / 55<div class="wowhead-tooltip-item-classes">Classes: <a href="/classic/class=1/warrior" class="c1">Warrior</a></div></td></tr></table><table><tr><td>Requires Level <!--rlvl-->60<br><!--rr--><!--useText:0:1--><span id="useText1" class="q2">Equip: <!--useEffect:0:1--><a href="/classic/spell=432639/increased-hit-chance-1" class="q2">Improves your chance to hit with all spells and attacks by 1%.</a><!--useEffect:1--></span><!--useText:1--><br><!--useText:0:2--><span id="useText2" class="q2">Equip: <!--useEffect:0:2--><a href="/classic/spell=1213288/increased-expertise-1" class="q2">Reduces the chance for your attacks to be dodged or parried by 1%.</a><!--useEffect:2--></span><!--useText:2--><br><!--useText:0:3--><span id="useText3" class="q2">Equip: <!--useEffect:0:3--><a href="/classic/spell=1213971/haste" class="q2">Increases your attack speed by 2%.</a><!--useEffect:3--></span><!--useText:3--><!--itemEffects:1--><br /><br /><span class="q"><a href="/classic/item-set=1883/dreadnaughts-warplate" class="q">Dreadnaught's Warplate</a> (0/9)</span><div class="q0 indent"><span><!--si236016--><a href="/classic/item=236016/dreadnaught-horns">Dreadnaught Horns</a></span><br /><span><!--si236017--><a href="/classic/item=236017/dreadnaught-shoulders">Dreadnaught Shoulders</a></span><br /><span><!--si236014--><a href="/classic/item=236014/dreadnaught-cuirass">Dreadnaught Cuirass</a></span><br /><span><!--si236020--><a href="/classic/item=236020/dreadnaught-belt">Dreadnaught Belt</a></span><br /><span><!--si236015--><a href="/classic/item=236015/dreadnaught-tassets">Dreadnaught Tassets</a></span><br /><span><!--si236018--><a href="/classic/item=236018/dreadnaught-greaves">Dreadnaught Greaves</a></span><br /><span><!--si236021--><a href="/classic/item=236021/dreadnaught-wrists">Dreadnaught Wrists</a></span><br /><span><!--si236019--><a href="/classic/item=236019/dreadnaught-grips">Dreadnaught Grips</a></span><br /><span><!--si236022--><a href="/classic/item=236022/band-of-the-dreadnaught">Band of the Dreadnaught</a></span></div><br /><span class="q0"><span>(2) Set : <a href="/classic/spell=1219481/s03-item-naxxramas-warrior-damage-2p-bonus">Increases damage done by your Deep Wounds talent by 20%.</a></span><br /><span>(4) Set : <a href="/classic/spell=1219483/s03-item-naxxramas-warrior-damage-4p-bonus">Reduces the cooldown on your Bloodthirst, Mortal Strike, and Shield Slam abilities by 25%.</a></span><br /><span>(6) Set : <a href="/classic/spell=1219486/s03-item-naxxramas-warrior-damage-6p-bonus">Your melee critical strikes against Undead enemies grant you 2% increased damage and critical damage done to Undead for 30 sec, stacking up to 9 times.</a></span></span><br><!--pvpEquip--><!--pvpEquip--><div class="whtt-sellprice">Sell Price: <span class="moneygold">5</span> <span class="moneysilver">39</span> <span class="moneycopper">74</span></div></td></tr></table>`,
                    quality: 4,
                    expectedLevel: 88,
                    expectedType: 'INVTYPE_HAND',
                    expectedQualityName: 'Epic',
                },
                {
                    label: 'The Face of Death (Off Hand shield)',
                    itemId: 236336,
                    icon: 'inv_shield_26',
                    tooltip: `<table><tr><td><!--nstart--><b class="q4">The Face of Death</b><!--nend--><!--ndstart--><!--ndend--><span class="q"><br>Item Level <!--ilvl-->90</span><!--bo--><br>Binds when picked up<!--ue--><table width="100%"><tr><td>Off Hand</td><th><!--scstart4:6--><span class="q1">Shield</span><!--scend--></th></tr></table><!--rf--><span><!--amr-->3354 Armor</span><br>66 Block<br><span><!--stat7-->+17 Stamina</span><!--ebstats--><!--egstats--><!--eistats--><!--nameDescStats--><!--rs--><!--e--><!--ps--><br>Durability 120 / 120</td></tr></table><table><tr><td>Requires Level <!--rlvl-->60<br><!--rr--><!--useText:0:1--><span id="useText1" class="q2">Equip: <!--useEffect:0:1--><a href="/classic/spell=432639/increased-hit-chance-1" class="q2">Improves your chance to hit with all spells and attacks by 1%.</a><!--useEffect:1--></span><!--useText:1--><br><!--useText:0:2--><span id="useText2" class="q2">Equip: <!--useEffect:0:2--><a href="/classic/spell=28112/block-value-21" class="q2">Increases the block value of your shield by 21.</a><!--useEffect:2--></span><!--useText:2--><br><!--useText:0:3--><span id="useText3" class="q2">Equip: <!--useEffect:0:3--><a href="/classic/spell=21410/increased-defense" class="q2">Increased Defense +14.</a><!--useEffect:3--></span><!--useText:3--><!--itemEffects:1--><br><!--pvpEquip--><!--pvpEquip--><div class="whtt-sellprice">Sell Price: <span class="moneygold">17</span> <span class="moneysilver">48</span> <span class="moneycopper">10</span></div></td></tr></table>`,
                    quality: 4,
                    expectedLevel: 90,
                    expectedType: 'INVTYPE_SHIELD',
                    expectedQualityName: 'Epic',
                },
                {
                    label: 'Cryptfiend Silk Cloak (Back slot alias)',
                    itemId: 236258,
                    icon: 'inv_misc_cape_naxxramas_02',
                    tooltip: `<table><tr><td><!--nstart--><b class="q4">Cryptfiend Silk Cloak</b><!--nend--><!--ndstart--><br /><span style="color: #34FDF0">Sanctified</span><!--ndend--><span class="q"><br>Item Level <!--ilvl-->83</span><!--bo--><br>Binds when picked up<!--ue--><table width="100%"><tr><td>Back</td></tr></table><!--rf--><span class="q2 tip" data-simple-tooltip="&lt;span class=&quot;q&quot;&gt;Has 140 bonus armor.&lt;/span&gt;"><!--amr-->203 Armor</span><br><span><!--stat7-->+14 Stamina</span><!--ebstats--><!--egstats--><!--eistats--><!--nameDescStats--><!--rs--><!--e--><!--ps--></td></tr></table><table><tr><td>Requires Level <!--rlvl-->60<br><!--rr--><!--useText:0:1--><span id="useText1" class="q2">Equip: <!--useEffect:0:1--><a href="/classic/spell=432639/increased-hit-chance-1" class="q2">Improves your chance to hit with all spells and attacks by 1%.</a><!--useEffect:1--></span><!--useText:1--><br><!--useText:0:3--><span id="useText3" class="q2">Equip: <!--useEffect:0:3--><a href="/classic/spell=21408/increased-defense" class="q2">Increased Defense +12.</a><!--useEffect:3--></span><!--useText:3--><!--itemEffects:1--><br><!--pvpEquip--><!--pvpEquip--><div class="whtt-sellprice">Sell Price: <span class="moneygold">6</span> <span class="moneysilver">16</span> <span class="moneycopper">51</span></div></td></tr></table>`,
                    quality: 4,
                    expectedLevel: 83,
                    expectedType: 'INVTYPE_CLOAK',
                    expectedQualityName: 'Epic',
                },
                {
                    label: 'Thunderfury (One-Hand weapon)',
                    itemId: 230224,
                    icon: 'inv_sword_39',
                    tooltip: `<table><tr><td><!--nstart--><b class="q5">Thunderfury, Blessed Blade of the Windseeker</b><!--nend--><!--ndstart--><!--ndend--><span class="q"><br>Item Level <!--ilvl-->80</span><!--bo--><br>Binds when picked up<br>Unique<table width="100%"><tr><td>One-Hand</td><th><!--scstart2:7--><span class="q1">Sword</span><!--scend--></th></tr></table><!--rf--><table width="100%"><tr>
    <td><span><!--dmg-->82 - 153 Damage</span></td>
    <th>Speed <!--spd-->1.90</th>
</tr></table><!--dps-->(61.84 damage per second)<br><span><!--stat3-->+5 Agility</span><br><span><!--stat7-->+8 Stamina</span><!--ebstats--><!--egstats--><!--eistats--><!--nameDescStats--><!--rs--><br>+8 Fire Resistance<br>+9 Nature Resistance<!--e--><!--ps--><br>Durability 125 / 125</td></tr></table><table><tr><td>Requires Level <!--rlvl-->60<br><!--rr--><!--useText:0:1--><span id="useText1" class="q2">Chance on hit: <!--useEffect:0:1--><a href="/classic/spell=468156/thunderfury" class="q2">Blasts your enemy with lightning, dealing 300 Nature damage and then jumping to additional nearby enemies. &nbsp;Each jump reduces that victim's Nature resistance by 25. Affects 5 targets. Your primary target is also consumed by a cyclone, slowing its attack speed by 20% for 12 sec.</a><!--useEffect:1--></span><!--useText:1--><!--itemEffects:1--><br><!--pvpEquip--><!--pvpEquip--><div class="whtt-sellprice">Sell Price: <span class="moneygold">25</span> <span class="moneysilver">53</span> <span class="moneycopper">55</span></div></td></tr></table>`,
                    quality: 5,
                    expectedLevel: 80,
                    expectedType: 'INVTYPE_WEAPON',
                    expectedQualityName: 'Legendary',
                },
            ]

            it.each(cases)(
                'parses %s tooltip',
                async ({ label, itemId, icon, tooltip, quality, expectedLevel, expectedType, expectedQualityName }) => {
                    mockFetch.mockResolvedValueOnce({
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        json: async () => ({
                            name: label.split(' (')[0],
                            quality,
                            icon,
                            tooltip,
                            spells: [],
                        }),
                    })

                    const result = await service.fetchItemDetails(itemId)

                    expect(result).toMatchObject({
                        id: itemId,
                        name: label.split(' (')[0],
                        icon: `https://wow.zamimg.com/images/wow/icons/medium/${icon}.jpg`,
                        icons: {
                            small: `https://wow.zamimg.com/images/wow/icons/small/${icon}.jpg`,
                            medium: `https://wow.zamimg.com/images/wow/icons/medium/${icon}.jpg`,
                            large: `https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`,
                        },
                        level: expectedLevel,
                        type: expectedType,
                        qualityName: expectedQualityName,
                        spells: [],
                    })
                }
            )
        })
    })
})
