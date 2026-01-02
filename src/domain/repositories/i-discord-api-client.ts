export interface IDiscordApiClient {
    getDiscordUserInfo(token: string): Promise<{ id: string; username: string } | null>;
}