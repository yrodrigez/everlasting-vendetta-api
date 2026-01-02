import { createLogger } from "@infrastructure/logging";
import { IDiscordApiClient } from "@repositories/i-discord-api-client";

export class DiscordApi implements IDiscordApiClient {
    private logger = createLogger('DiscordApi');
    constructor() { }
    public async getDiscordUserInfo(token: string): Promise<{ id: string; username: string } | null> {
        try {
            const response = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                this.logger.error(`Discord API error: ${response.status}`);
                return null;
            }

            const data = await response.json() as { id: string; username: string };
            return {
                id: data.id,
                username: data.username
            };
        } catch (error) {
            this.logger.error('Failed to fetch Discord user info', error);
            return null;
        }
    }
}