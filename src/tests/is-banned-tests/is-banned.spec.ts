import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BannedRepository } from "../../infrastructure/repositories/banned-repository";

type BannedMemberRow = {
    user_id: string;
    banned_member?: { id: string; user_id: string }[];
};

describe("BannedRepository", () => {
    let bannedRepository: BannedRepository;
    let mockDatabaseClient: any;

    beforeEach(() => {
        mockDatabaseClient = {
            from: jest.fn(),
        };
        bannedRepository = new BannedRepository(mockDatabaseClient);
    });

    function mockIsUserBannedQuery(
        data: BannedMemberRow[] | null,
        error: { message: string } | null = null
    ) {
        const mockOverrideTypes = jest.fn();
        // @ts-expect-error - Mocking Supabase response
        mockOverrideTypes.mockResolvedValue({ data, error });

        const mockChain = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            overrideTypes: mockOverrideTypes,
        };

        mockDatabaseClient.from = jest.fn().mockReturnValue(mockChain);

        return mockChain;
    }

    describe("isUserBanned", () => {
        describe("Positive Cases - User is Banned", () => {
            it("should return true when one of the user members has a ban relation", async () => {
                const userId = "banned-user-123";
                const mockData = [
                    {
                        user_id: userId,
                        banned_member: [{ id: "ban-1", user_id: userId }],
                    },
                ];
                const mockChain = mockIsUserBannedQuery(mockData);

                const result = await bannedRepository.isUserBanned(userId);

                expect(result).toBe(true);
                expect(mockDatabaseClient.from).toHaveBeenCalledWith(
                    "ev_member"
                );
                expect(mockChain.select).toHaveBeenCalledWith(
                    "user_id, banned_member(id, user_id)"
                );
                expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
                expect(mockChain.overrideTypes).toHaveBeenCalledTimes(1);
            });

            it("should return true when at least one member is banned among several members", async () => {
                const userId = "user-with-banned-char-456";
                const mockData = [
                    { user_id: userId, banned_member: [] },
                    {
                        user_id: userId,
                        banned_member: [{ id: "ban-2", user_id: userId }],
                    },
                ];
                mockIsUserBannedQuery(mockData);

                const result = await bannedRepository.isUserBanned(userId);

                expect(result).toBe(true);
            });
        });

        describe("Negative Cases - User is Not Banned", () => {
            it("should return false when the user has no members", async () => {
                const userId = "clean-user-303";
                const mockChain = mockIsUserBannedQuery([]);

                const result = await bannedRepository.isUserBanned(userId);

                expect(result).toBe(false);
                expect(mockDatabaseClient.from).toHaveBeenCalledWith(
                    "ev_member"
                );
                expect(mockChain.select).toHaveBeenCalledWith(
                    "user_id, banned_member(id, user_id)"
                );
                expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
            });

            it("should return false when the user members have no ban relations", async () => {
                const userId = "has-clean-chars-505";
                const mockData = [
                    { user_id: userId, banned_member: [] },
                    { user_id: userId, banned_member: [] },
                ];
                mockIsUserBannedQuery(mockData);

                const result = await bannedRepository.isUserBanned(userId);

                expect(result).toBe(false);
            });

            it("should return false when data is null", async () => {
                const userId = "null-result-606";
                mockIsUserBannedQuery(null);

                const result = await bannedRepository.isUserBanned(userId);

                expect(result).toBe(false);
            });
        });

        describe("Error Handling", () => {
            it("should throw an error when database query fails", async () => {
                const userId = "error-user-789";
                const mockError = { message: "Database connection failed" };
                mockIsUserBannedQuery(null, mockError);

                await expect(
                    bannedRepository.isUserBanned(userId)
                ).rejects.toThrow(
                    `Error checking ban status for user ${userId}: ${mockError.message}`
                );
            });

            it("should handle database timeout errors gracefully", async () => {
                const userId = "timeout-user-808";
                const mockError = { message: "Query timeout exceeded" };
                mockIsUserBannedQuery(null, mockError);

                await expect(
                    bannedRepository.isUserBanned(userId)
                ).rejects.toThrow(
                    `Error checking ban status for user ${userId}: ${mockError.message}`
                );
            });
        });

        describe("Edge Cases", () => {
            it("should handle empty string userId", async () => {
                const userId = "";
                const mockChain = mockIsUserBannedQuery([]);

                const result = await bannedRepository.isUserBanned(userId);

                expect(result).toBe(false);
                expect(mockChain.eq).toHaveBeenCalledWith("user_id", "");
            });

            it("should handle special characters in userId", async () => {
                const userId = "user-with-special-chars-@#$%";
                const mockData = [
                    {
                        user_id: userId,
                        banned_member: [{ id: "ban-special", user_id: userId }],
                    },
                ];
                mockIsUserBannedQuery(mockData);

                const result = await bannedRepository.isUserBanned(userId);

                expect(result).toBe(true);
            });

            it("should handle UUID format userId", async () => {
                const userId = "550e8400-e29b-41d4-a716-446655440000";
                const mockData = [
                    {
                        user_id: userId,
                        banned_member: [{ id: "ban-uuid", user_id: userId }],
                    },
                ];
                mockIsUserBannedQuery(mockData);

                const result = await bannedRepository.isUserBanned(userId);

                expect(result).toBe(true);
            });
        });
    });

    describe("banUser", () => {
        it('should throw "Method not implemented" error', async () => {
            const userId = "user-to-ban";
            const reason = "Violation of terms";

            await expect(
                bannedRepository.banUser(userId, reason)
            ).rejects.toThrow("Method not implemented.");
        });
    });

    describe("unbanUser", () => {
        it('should throw "Method not implemented" error', async () => {
            const userId = "user-to-unban";

            await expect(bannedRepository.unbanUser(userId)).rejects.toThrow(
                "Method not implemented."
            );
        });
    });
});
