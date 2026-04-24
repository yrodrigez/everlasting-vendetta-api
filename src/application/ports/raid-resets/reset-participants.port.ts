
export type RaidResetParticipant = {
    characterId: number
    participationCreatedAt: Date
    resetId: string
    isConfirmed: boolean
    participationUpdatedAt: Date
    details: {
        role: 'tank' | 'healer' | 'dps' | 'tank-dps' | 'healer-dps' | 'tank-healer'
        status: 'confirmed' | 'tentative' | 'declined' | 'bench' | 'late'
        className: 'death knight' | 'demon hunter' | 'druid' | 'hunter' | 'mage' | 'monk' | 'paladin' | 'priest' | 'rogue' | 'shaman' | 'warlock' | 'warrior'
        rss: number
    }
    character: {
        name: string
        realmSlug: string
        createdAt: Date
        userId: string
    }

}

export interface RaidResetsParticipantPort {
    getParticipantsByResetId(resetId: string): Promise<RaidResetParticipant[]>
    updateParticipant(participant: RaidResetParticipant): Promise<void>
}