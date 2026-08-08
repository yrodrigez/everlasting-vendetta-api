import { describe, expect, it, jest } from "@jest/globals";
import { SetSelectedCharacterUseCase } from "../application/use-cases/set-selected-character-usecase";

describe("SetSelectedCharacterUseCase", () => {
    it("does not save selected character metadata when realm slug is missing", async () => {
        const memberRepository = {
            findAllByUserId: jest.fn(),
        };
        const logger = {
            info: jest.fn(),
            error: jest.fn(),
        };
        const store = {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
        };
        const useCase = new SetSelectedCharacterUseCase(
            memberRepository as any,
            logger as any,
            store as any
        );

        await expect(
            useCase.execute("user-1", 1, {
                id: 1,
                name: "Alveric",
            })
        ).rejects.toThrow("Selected character is missing realm");

        expect(memberRepository.findAllByUserId).not.toHaveBeenCalled();
        expect(store.set).not.toHaveBeenCalled();
    });
});
