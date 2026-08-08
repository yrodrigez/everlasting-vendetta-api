import { describe, expect, it, jest } from "@jest/globals";
import { LoginUseCase } from "../application/use-cases/login/login.usecase";

const authResult = {
    userId: "user-1",
    refreshToken: "refresh-token",
    accessToken: "access-token",
    refreshTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
    accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 600,
};

describe("LoginUseCase", () => {
    it("removes an invalid selected character and fails login when its realm is missing", async () => {
        const store: any = {
            get: jest.fn(async () => ({
                id: 1,
                name: "Alveric",
            })),
            set: jest.fn(),
            remove: jest.fn(),
        };
        const useCase = new LoginUseCase(
            {
                execute: jest.fn(async () => authResult),
            } as any,
            {
                execute: jest.fn(),
            } as any,
            store as any
        );

        await expect(
            useCase.execute({
                access_token: "token",
                provider: "bnet_oauth",
                expires_at: authResult.accessTokenExpiresAt,
            })
        ).rejects.toMatchObject({
            message: "Selected character is missing realm",
            code: "SELECTED_CHARACTER_MISSING_REALM",
            statusCode: 400,
        });

        expect(store.get).toHaveBeenCalledWith("selected_character:user-1");
        expect(store.remove).toHaveBeenCalledWith("selected_character:user-1");
        expect(store.set).not.toHaveBeenCalled();
    });

    it("stores the session when the selected character has a realm slug", async () => {
        const store: any = {
            get: jest.fn(async () => ({
                id: 1,
                name: "Alveric",
                realm: {
                    slug: "spineshatter",
                },
            })),
            set: jest.fn(),
            remove: jest.fn(),
        };
        const useCase = new LoginUseCase(
            {
                execute: jest.fn(async () => authResult),
            } as any,
            {
                execute: jest.fn(),
            } as any,
            store as any
        );

        const result = await useCase.execute({
            access_token: "token",
            provider: "bnet_oauth",
            expires_at: authResult.accessTokenExpiresAt,
        });

        expect(result.sessionId).toEqual(expect.any(String));
        expect(store.remove).not.toHaveBeenCalled();
        expect(store.set).toHaveBeenCalledWith(
            expect.stringMatching(/^session:/),
            expect.not.objectContaining({ userId: "user-1" }),
            expect.any(Number)
        );
    });
});
