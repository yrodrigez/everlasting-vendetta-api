import BlizzardApi from "./blizzard-api.ts";
import { WoWCharacter } from "../../domain/entities/wow/wow-character.ts";
import { BlizzardApiError } from "../../domain/errors/blizzard-api-error.ts";
import { IWowCharacterService } from "../../domain/repositories/i-wow-character-service.ts";
import { findNamespace } from "@infrastructure/environment.ts";

export class WowCharacterService extends BlizzardApi
	implements IWowCharacterService {

	async getCharacter(realmSlug: string, characterName: string, token: string): Promise<WoWCharacter> {
		const isCharacterNameValid = /^\p{L}{2,12}$/u.test(characterName.toLocaleLowerCase())
		if (!isCharacterNameValid) {
			throw new Error(`Invalid character name: ${characterName}`);
		}
		const namespace = findNamespace(realmSlug, 'profile');
		if (!namespace) {
			throw new Error(`Namespace not found for realm: ${realmSlug}`);
		}
		const response = await fetch(
			this.createUrl(
				`/profile/wow/character/${realmSlug}/${characterName.toLowerCase()}`,
				{ namespace },
			),
			{
				headers: {
					"Authorization": `Bearer ${token}`,
				},
			},
		);

		if (!response.ok) {
			const text = await response.text();
			console.error(
				`Error fetching character data: ${characterName} on ${realmSlug}`,
				response.status,
				text,
			);
			throw new BlizzardApiError(
				`Error fetching character data: ${response.status} - ${text}`,
				response.status,
			);
		}

		const data = await response.json();

		return WoWCharacter.fromApiResponse(data);
	}

	async getCharacterAvatar(realmSlug: string, characterName: string, token: string): Promise<string> {
		const namespace = findNamespace(realmSlug, 'profile');
		if (!namespace) {
			throw new Error(`Namespace not found for realm: ${realmSlug}`);
		}
		const response = await fetch(
			this.createUrl(
				`/profile/wow/character/${realmSlug}/${characterName.toLowerCase()}/character-media`,
				{ namespace },
			),
			{
				headers: {
					"Authorization": `Bearer ${token}`,
				},
			},
		);

		if (!response.ok) {
			return "/avatar-anon.png";
		}

		const data = await response.json() as { assets?: { key: string; value: string }[] };
		const avatarObject =
			(data?.assets ?? []).find((asset: { key: string; value: string }) => asset?.key === "avatar") ??
			{ value: "/avatar-anon.png" };

		return avatarObject.value;
	}

	async getCharacterWithAvatar(realmSlug: string, characterName: string, token: string): Promise<WoWCharacter> {
		// Fetch both character data and avatar in parallel for better performance
		const [character, avatar] = await Promise.all([
			this.getCharacter(realmSlug, characterName, token),
			this.getCharacterAvatar(realmSlug, characterName, token)
		]);

		return character.withAvatar(avatar);
	}
}
