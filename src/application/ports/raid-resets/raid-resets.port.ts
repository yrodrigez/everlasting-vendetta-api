export interface RaidResetsPort {
    getResetCreatedBy(resetId: string): Promise<{
        id: string
        raidDate: string
        time: string
        createdBy: {
            name: string
            realmSlug: string
            id: number
        }
    }>
}