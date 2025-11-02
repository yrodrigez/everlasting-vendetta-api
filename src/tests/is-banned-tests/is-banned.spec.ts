import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BannedRepository } from '../../infrastructure/repositories/banned-repository';

describe('BannedRepository', () => {
    let bannedRepository: BannedRepository;
    let mockDatabaseClient: any;

    beforeEach(() => {
        mockDatabaseClient = {
            from: jest.fn(),
        };
        bannedRepository = new BannedRepository(mockDatabaseClient);
    });

    describe('isUserBanned', () => {
        describe('Positive Cases - User is Banned', () => {
            it('should return true when user_id is directly in banned_members table', async () => {
                const userId = 'banned-user-123';
                const mockData = [{ user_id: userId }];
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: mockData, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(true);
                expect(mockDatabaseClient.from).toHaveBeenCalledWith('banned_members');
                expect(mockChain.select).toHaveBeenCalledWith('user_id, ev_member!inner(user_id)');
                expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId);
                expect(mockChain.or).toHaveBeenCalledWith(`ev_member.user_id.eq."${userId}"`);
            });

            it('should return true when user has a banned character (via ev_member relation)', async () => {
                const userId = 'user-with-banned-char-456';
                const mockData = [{ user_id: 'different-member-id', ev_member: { user_id: userId } }];
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: mockData, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(true);
                expect(mockDatabaseClient.from).toHaveBeenCalledWith('banned_members');
                expect(mockChain.or).toHaveBeenCalledWith(`ev_member.user_id.eq."${userId}"`);
            });

            it('should return true when both user_id matches directly AND user has banned character', async () => {
                const userId = 'double-banned-789';
                const mockData = [
                    { user_id: userId },
                    { user_id: 'member-id', ev_member: { user_id: userId } }
                ];
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: mockData, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(true);
                expect(mockData.length).toBeGreaterThan(0);
            });

            it('should return true when only user_id condition matches (not character)', async () => {
                const userId = 'only-user-banned-101';
                const mockData = [{ user_id: userId }];
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: mockData, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(true);
                expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId);
            });

            it('should return true when only character (member_id) condition matches (not direct user_id)', async () => {
                const userId = 'only-char-banned-202';
                const mockData = [{ user_id: 'some-member-id', ev_member: { user_id: userId } }];
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: mockData, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(true);
                expect(mockChain.or).toHaveBeenCalledWith(`ev_member.user_id.eq."${userId}"`);
            });
        });

        describe('Negative Cases - User is Not Banned', () => {
            it('should return false when user_id is not in banned_members table and has no banned characters', async () => {
                const userId = 'clean-user-303';
                const mockData: any[] = [];
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: mockData, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(false);
                expect(mockDatabaseClient.from).toHaveBeenCalledWith('banned_members');
                expect(mockChain.select).toHaveBeenCalledWith('user_id, ev_member!inner(user_id)');
                expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId);
                expect(mockChain.or).toHaveBeenCalledWith(`ev_member.user_id.eq."${userId}"`);
            });

            it('should return false when user has no characters in ev_member', async () => {
                const userId = 'no-characters-404';
                const mockData: any[] = [];
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: mockData, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(false);
            });

            it('should return false when user has characters but none are banned', async () => {
                const userId = 'has-clean-chars-505';
                const mockData: any[] = [];
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: mockData, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(false);
            });

            it('should return false when data is null', async () => {
                const userId = 'null-result-606';
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: null, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(false);
            });

            it('should return false when userId does not match any records', async () => {
                const userId = 'non-existent-707';
                const mockData: any[] = [];
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: mockData, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(false);
            });
        });

        describe('Error Handling', () => {
            it('should throw an error when database query fails', async () => {
                const userId = 'error-user-789';
                const mockError = { message: 'Database connection failed' };
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: null, error: mockError });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                await expect(bannedRepository.isUserBanned(userId)).rejects.toThrow(
                    `Error checking ban status for user ${userId}: ${mockError.message}`
                );
            });

            it('should handle database timeout errors gracefully', async () => {
                const userId = 'timeout-user-808';
                const mockError = { message: 'Query timeout exceeded' };
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: null, error: mockError });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                await expect(bannedRepository.isUserBanned(userId)).rejects.toThrow(
                    `Error checking ban status for user ${userId}: ${mockError.message}`
                );
            });
        });

        describe('Edge Cases', () => {
            it('should handle empty string userId', async () => {
                const userId = '';
                const mockData: any[] = [];
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: mockData, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(false);
                expect(mockChain.eq).toHaveBeenCalledWith('user_id', '');
            });

            it('should handle special characters in userId', async () => {
                const userId = 'user-with-special-chars-@#$%';
                const mockData = [{ user_id: userId }];
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: mockData, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(true);
                expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId);
                expect(mockChain.or).toHaveBeenCalledWith(`ev_member.user_id.eq."${userId}"`);
            });

            it('should handle UUID format userId', async () => {
                const userId = '550e8400-e29b-41d4-a716-446655440000';
                const mockData = [{ user_id: userId }];
                const mockReturns = jest.fn();
                // @ts-expect-error - Mocking Supabase response
                mockReturns.mockResolvedValue({ data: mockData, error: null });
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    returns: mockReturns,
                };
                mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);
                const result = await bannedRepository.isUserBanned(userId);
                expect(result).toBe(true);
            });
        });
    });

    describe('banUser', () => {
        it('should throw "Method not implemented" error', async () => {
            const userId = 'user-to-ban';
            const reason = 'Violation of terms';
            await expect(bannedRepository.banUser(userId, reason)).rejects.toThrow(
                'Method not implemented.'
            );
        });
    });

    describe('unbanUser', () => {
        it('should throw "Method not implemented" error', async () => {
            const userId = 'user-to-unban';
            await expect(bannedRepository.unbanUser(userId)).rejects.toThrow(
                'Method not implemented.'
            );
        });
    });
});
