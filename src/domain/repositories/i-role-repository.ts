export interface IRoleRepository {
	findByMemberId(memberId: string): Promise<string[]>;
}