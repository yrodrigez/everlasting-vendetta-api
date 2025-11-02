import type {
	CachedGearScore,
	IGearScoreCacheRepository,
} from "@repositories/gearscore/i-gearscore-cache-repository.ts";
import type { GearScoreColor } from "../../domain/entities/gearscore/gear-score.ts";
import type { DatabaseClient } from "../database/database-client-factory.ts";

export class GearScoreCacheRepository implements IGearScoreCacheRepository {
	constructor(private readonly supabase: DatabaseClient) {}

	async getByHash(hash: string): Promise<CachedGearScore | null> {
		const { data, error } = await this.supabase
			.from("gs_cache")
			.select("gs, color")
			.eq("md5", hash)
			.maybeSingle();

		if (error) {
			throw new Error(
				`Error fetching gearscore from cache: ${error.message}`,
			);
		}

		if (!data) {
			return null;
		}

		return {
			score: data.gs,
			color: data.color as GearScoreColor,
		};
	}

	async save(
		hash: string,
		score: number,
		color: GearScoreColor,
	): Promise<void> {
		const { error } = await this.supabase.from("gs_cache").upsert({
			md5: hash,
			gs: score,
			color,
		});

		if (error) {
			throw new Error(
				`Error saving gear score to cache: ${error.message}`,
			);
		}
	}
}
