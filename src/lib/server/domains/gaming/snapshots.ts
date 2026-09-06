import { db } from '$lib/server/db';
import {
	serverSnapshots,
	type NewServerSnapshot,
	type ServerSnapshot
} from '$lib/server/db/schemas';
import { GAME_SERVERS, type GameServerSlug } from '$lib/types/rpcs/private/gaming/servers';
import { desc, eq, lt } from 'drizzle-orm';
import { gamingConfig } from './config';

export const Insert = async (rows: NewServerSnapshot[]): Promise<undefined> => {
	if (rows.length === 0) return;
	await db.insert(serverSnapshots).values(rows);
};

export const Latest = async (): Promise<Map<GameServerSlug, ServerSnapshot>> => {
	const entries = await Promise.all(
		GAME_SERVERS.map(async (server): Promise<[GameServerSlug, ServerSnapshot | undefined]> => [
			server.slug,
			await db
				.select()
				.from(serverSnapshots)
				.where(eq(serverSnapshots.service, server.slug))
				.orderBy(desc(serverSnapshots.recordedAt))
				.limit(1)
				.then((rows): ServerSnapshot | undefined => rows.at(0))
		])
	);

	const latest = new Map<GameServerSlug, ServerSnapshot>();
	for (const [slug, row] of entries) if (row) latest.set(slug, row);
	return latest;
};

export const Sweep = async (now: Date = new Date()): Promise<number> => {
	const cutoff = new Date(now.getTime() - gamingConfig.retentionDays * 24 * 60 * 60 * 1_000);
	const result = await db.delete(serverSnapshots).where(lt(serverSnapshots.recordedAt, cutoff));
	return result.count;
};
