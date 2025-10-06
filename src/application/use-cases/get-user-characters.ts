import { IUserRepository } from "@repositories/i-user-repository";
import { ITokenService } from "src/domain/services/i-token-service";
import { IWowCharacterService } from "@repositories/i-wow-character-service";
import { Member } from "@entities/member";
import { WoWCharacter } from "@entities/wow/wow-character";
import { createLogger } from "../../infrastructure/logging/index.ts";
import { AuthError } from "@errors/auth-error";
import { UserRepositoryError } from "@errors/user-repository-error";
import { BlizzardApiError } from "@errors/blizzard-api-error";

export class GetUserCharacters {
    private logger = createLogger("GetUserCharacters");

    constructor(
        private tokenService: ITokenService,
        private usersRepository: IUserRepository,
        private charactersService: IWowCharacterService,
    ) { }

    async execute({ accessToken, realmSlug }: {
        accessToken: string;
        realmSlug?: string;
    }): Promise<WoWCharacter[]> {
        let userId: string;

        // Verify the access token and extract user ID
        try {
            const tokenPayload = this.tokenService.verifyAccessToken(accessToken);
            userId = tokenPayload.sub; // Subject contains the user ID
            this.logger.info(`Fetching characters for user ${userId}${realmSlug ? ` on realm ${realmSlug}` : ''}`);
        } catch (error) {
            this.logger.error('Invalid or expired access token', error);
            throw new AuthError(
                'Invalid or expired access token',
                'INVALID_TOKEN',
                401
            );
        }

        // Get the user's characters from the database
        let storedCharacters: Member[];
        try {
            storedCharacters = await this.usersRepository.findCharactersByUserId(userId, realmSlug);
            this.logger.info(`Found ${storedCharacters.length} stored character(s) for user ${userId}`);
        } catch (error) {
            this.logger.error(`Database error fetching characters for user ${userId}`, error);
            if (error instanceof UserRepositoryError) {
                throw error;
            }
            throw new UserRepositoryError(
                `Failed to fetch characters from database: ${(error as Error).message}`
            );
        }

        // Return early if no characters found
        if (storedCharacters.length === 0) {
            this.logger.info(`No characters found for user ${userId}`);
            return [];
        }

        // Fetch updated character data from Blizzard API
        let updatedCharacters: (WoWCharacter | null)[];
        try {
            updatedCharacters = await Promise.all(
                storedCharacters.map(async (member) => {
                    try {
                        const char = member.character;
                        
                        // Skip low-level characters
                        if (char.level < 10) {
                            this.logger.debug(`Skipping low-level character ${char.name} (level ${char.level})`);
                            return new WoWCharacter(
                                char.id,
                                member.wowAccountId,
                                char.name,
                                char.realm,
                                char.level,
                                char.last_login_timestamp,
                                { name: char.character_class.name || '', id: 0 },
                                { name: char.playable_class.name, id: 0 },
                                char.guild,
                                char.avatar,
                            );
                        }

                        // Fetch updated character data from Blizzard
                        const character = await this.charactersService.getCharacter(
                            char.realm.slug,
                            char.name,
                        );

                        this.logger.info(`Fetched updated character ${char.name} on realm ${char.realm.slug} with level ${character.level}`);

                        // Fetch character avatar
                        const avatar = await this.charactersService.getCharacterAvatar(
                            char.realm.slug,
                            char.name,
                        );

                        if (character && avatar) {
                            return character.withAvatar(avatar);
                        }

                        return character;
                    } catch (error) {
                        this.logger.error(`Error fetching updated data for character ${member.character.name}`, error);
                        // Return the stored character data as fallback
                        const char = member.character;
                        return new WoWCharacter(
                            char.id,
                            member.wowAccountId,
                            char.name,
                            char.realm,
                            char.level,
                            char.last_login_timestamp,
                            { name: char.character_class.name || '', id: 0 },
                            { name: char.playable_class.name, id: 0 },
                            char.guild,
                            char.avatar,
                        );
                    }
                })
            );
        } catch (error) {
            this.logger.error(`Error updating characters from Blizzard API for user ${userId}`, error);
            // If Blizzard API fails completely, return stored characters as fallback
            this.logger.warn(`Returning stored character data as fallback for user ${userId}`);
            return storedCharacters.map(member => {
                const char = member.character;
                return new WoWCharacter(
                    char.id,
                    member.wowAccountId,
                    char.name,
                    char.realm,
                    char.level,
                    char.last_login_timestamp,
                    { name: char.character_class.name || '', id: 0 },
                    { name: char.playable_class.name, id: 0 },
                    char.guild,
                    char.avatar,
                );
            });
        }

        const validCharacters = updatedCharacters.filter(Boolean) as WoWCharacter[];
        
        this.logger.info(`Returning ${validCharacters.length} updated character(s) for user ${userId}`);

        return validCharacters;
    }
}