import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetSelectedCharacterByDiscordIdUseCase } from "../../application/use-cases/get-selected-character-by-discord-id-usecase";

describe("GetSelectedCharacterByDiscordIdUseCase", () => {
    let useCase: GetSelectedCharacterByDiscordIdUseCase;
    let mockAuthRepository: any;
    let mockMemberRepository: any;

    const mockMemberRow = {
        id: 123,
        user_id: "user-uuid-1",
        wow_account_id: 456,
        is_selected: true,
        character: {
            id: 123,
            name: "Arthas",
            realm: {
                id: 1,
                name: "Pyrewood Village",
                slug: "pyrewood-village",
            },
            level: 60,
            playable_class: { name: "Paladin" },
            character_class: { name: "Paladin" },
            guild: { id: 10, name: "Everlasting Vendetta", rank: 2 },
            avatar: "/avatar.png",
            last_login_timestamp: 1700000000,
            faction: "Alliance",
        },
        registration_source: "bnet_oauth",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
    };

    beforeEach(() => {
        mockAuthRepository = {
            findUserByProviderUserId: jest.fn(),
        };
        mockMemberRepository = {
            findSelectedByUserId: jest.fn(),
        };
        useCase = new GetSelectedCharacterByDiscordIdUseCase(
            mockAuthRepository,
            mockMemberRepository
        );
    });

    it("should return the selected character when a valid discordId is provided", async () => {
        const discordId = "123456789";
        const oauthProvider = { userId: "user-uuid-1" };

        mockAuthRepository.findUserByProviderUserId.mockResolvedValue(
            oauthProvider
        );
        mockMemberRepository.findSelectedByUserId.mockResolvedValue(
            mockMemberRow
        );

        const result = await useCase.execute(discordId);

        expect(
            mockAuthRepository.findUserByProviderUserId
        ).toHaveBeenCalledWith(discordId, "discord_oauth");
        expect(mockMemberRepository.findSelectedByUserId).toHaveBeenCalledWith(
            "user-uuid-1"
        );
        expect(result).toEqual(mockMemberRow);
    });

    it("should throw an error when no user is found for the discordId", async () => {
        const discordId = "nonexistent-discord-id";
        mockAuthRepository.findUserByProviderUserId.mockResolvedValue(null);

        await expect(useCase.execute(discordId)).rejects.toThrow(
            "No user found for the provided Discord ID"
        );
        expect(
            mockMemberRepository.findSelectedByUserId
        ).not.toHaveBeenCalled();
    });

    it("should throw an error when no selected character is found for the user", async () => {
        const discordId = "123456789";
        const oauthProvider = { userId: "user-uuid-1" };

        mockAuthRepository.findUserByProviderUserId.mockResolvedValue(
            oauthProvider
        );
        mockMemberRepository.findSelectedByUserId.mockResolvedValue(null);

        await expect(useCase.execute(discordId)).rejects.toThrow(
            "No selected character found for this user"
        );
    });
});
