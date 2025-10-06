import { WoWCharacter } from "@entities/wow/wow-character.ts";
import { IWowCharacterService } from "../../domain/repositories/i-wow-character-service.ts";
import { createLogger } from "../../infrastructure/logging/logger.ts";

export default class GetFullCharactersUsecase {
    private readonly logger = createLogger("GetFullCharactersUsecase");
    constructor(
        private characterService: IWowCharacterService,
    ) { }

    async execute(
        characters: { realmSlug: string; name: string, level: number }[],
    ): Promise<WoWCharacter[]> {
        const result = await Promise.all(
            characters.map(async (char) => {
                try {
                    if (char.level < 10) {
                        return char;
                    }

                    const character = await this.characterService.getCharacterWithAvatar(
                        char.realmSlug,
                        char.name,
                    );
                    this.logger.info(`Fetched character ${char.name} on realm ${char.realmSlug} with level ${character.level}`);

                    return character;
                } catch (e) {
                    this.logger.error(`Error fetching character ${char.name} with level on realm ${char.realmSlug}`, e);
                    return char;
                }
            }),
        );
        return result.filter(Boolean) as WoWCharacter[];
    }
}
