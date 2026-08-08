import { CharacterValidationService } from "@domain/services/character-validation-service";
import type { ICharacterValidationService } from "@domain/services/i-character-validation-service";
import { WowCharacterService } from "@external/wow-character-service";
import { createLogger } from "@infrastructure/logging";
import { BlizzardTokenRepository } from "@infrastructure/repositories/blizzard-token-repository";
import type ITokenRepository from "@repositories/i-token-repository";
import { LinkCharacterToUserUseCase } from "@use-cases/link-character-to-user";
import { SetSelectedCharacterUseCase } from "@use-cases/set-selected-character-usecase";
import { AUTH_TOKENS } from "../auth/auth.container";
import { type Container, createToken } from "../container";
import { DATABASE_TOKENS } from "../persistence/database.container";

export const CHARACTER_TOKENS = {
    CharacterValidationService: createToken<ICharacterValidationService>(
        "CharacterValidationService"
    ),
    BlizzardTokenRepository: createToken<ITokenRepository>(
        "BlizzardTokenRepository"
    ),
    LinkCharacterToUserUseCase: createToken<LinkCharacterToUserUseCase>(
        "LinkCharacterToUserUseCase"
    ),
    SetSelectedCharacterUseCase: createToken<SetSelectedCharacterUseCase>(
        "SetSelectedCharacterUseCase"
    ),
} as const;

export function registerCharacterDependencies(container: Container): void {
    container.singleton(CHARACTER_TOKENS.CharacterValidationService, (c) => {
        return new CharacterValidationService(
            new WowCharacterService(),
            c.resolve(AUTH_TOKENS.MemberRepository),
            c.resolve(AUTH_TOKENS.RealmsRepository)
        );
    });
    container.singleton(CHARACTER_TOKENS.BlizzardTokenRepository, (c) => {
        return new BlizzardTokenRepository(
            c.resolve(DATABASE_TOKENS.SupabaseClient),
            c.resolve(AUTH_TOKENS.BlizzardOauthService)
        );
    });
    container.singleton(CHARACTER_TOKENS.LinkCharacterToUserUseCase, (c) => {
        return new LinkCharacterToUserUseCase(
            c.resolve(AUTH_TOKENS.MemberRepository),
            c.resolve(CHARACTER_TOKENS.CharacterValidationService),
            c.resolve(CHARACTER_TOKENS.BlizzardTokenRepository),
            c.resolve(AUTH_TOKENS.EventTrackingService)
        );
    });
    container.singleton(CHARACTER_TOKENS.SetSelectedCharacterUseCase, (c) => {
        return new SetSelectedCharacterUseCase(
            c.resolve(AUTH_TOKENS.MemberRepository),
            createLogger("SetSelectedCharacterUseCase"),
            c.resolve(DATABASE_TOKENS.RedisStore)
        );
    });
}
