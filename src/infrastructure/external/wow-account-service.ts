import { WowUserProfile } from "../../domain/entities/wow/wow-user-profile.ts";
import { BlizzardApiError } from "../../domain/errors/blizzard-api-error.ts";
import { type IWowAccountService } from "../../domain/repositories/i-wow-account-service.ts";
import BlizzardApi from "./blizzard-api.ts";

export default class WowAccountService extends BlizzardApi
	implements IWowAccountService {

	constructor(private readonly namespaces: string[]) {
		super();
	}

	async getWoWAccount(token: string): Promise<WowUserProfile> {
		if (!token) {
			throw new Error("No Battle.net token provided");
		}

		const responses = await Promise.all(this.namespaces.map(async (ns) => {
			return fetch(
				this.createUrl(
					"profile/user/wow",
					{
						namespace: ns,
					},
				),
				{
					headers: {
						"Authorization": `Bearer ${token}`,
					},
				},
			);
		}));

		for (const response of responses) {

			if (!response.ok) {
				const errorData = await response.text();
				throw new BlizzardApiError(
					`Failed to fetch profile summary: ${response.status} ${response.statusText} - ${errorData}`,
				);
			}
		}

		const data = await Promise.all(
			responses.map(async (response) => await response.json()),
		);

		const accounts = data.map((accountData) => {
			return WowUserProfile.fromApiResponse(accountData);
		});

		const mergedAccount = accounts.reduce((acc, val) => {
			return new WowUserProfile(
				acc.id || val.id,
				[...acc.wow_accounts, ...val.wow_accounts],
			);
		},  new WowUserProfile(0, []));

		return mergedAccount;
	}
}
