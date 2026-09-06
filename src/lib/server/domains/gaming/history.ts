import { db } from '$lib/server/db';
import { serverSnapshots } from '$lib/server/db/schemas';
import {
	findGameServer,
	type GameServerSlug,
	type HistoryBucket,
	type HistoryRange,
	type HistoryResponse
} from '$lib/types/rpcs/private/gaming/servers';
import { sql } from 'drizzle-orm';

const RANGES: Record<HistoryRange, { windowSeconds: number; bucketSeconds: number }> = {
	hour: { windowSeconds: 60 * 60, bucketSeconds: 60 },
	day: { windowSeconds: 24 * 60 * 60, bucketSeconds: 5 * 60 },
	week: { windowSeconds: 7 * 24 * 60 * 60, bucketSeconds: 60 * 60 },
	month: { windowSeconds: 30 * 24 * 60 * 60, bucketSeconds: 6 * 60 * 60 }
};

const asNumber = (value: unknown): number | null => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (typeof value === 'string') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
};

const asDate = (value: unknown): Date | null => {
	if (value instanceof Date) return value;
	if (typeof value === 'string') {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}
	return null;
};

export const ForService = async (
	slug: GameServerSlug,
	range: HistoryRange
): Promise<HistoryResponse> => {
	const { windowSeconds, bucketSeconds } = RANGES[range];
	const to = new Date();
	const from = new Date(to.getTime() - windowSeconds * 1_000);
	const aggregated = (await db.execute(sql`
		SELECT
			to_timestamp(
				floor(extract(epoch from ${serverSnapshots.recordedAt}) / ${bucketSeconds}) * ${bucketSeconds}
			) AS bucket_start,
			count(*)::int AS samples,
			avg(CASE WHEN ${serverSnapshots.running} THEN 1 ELSE 0 END)::float8 AS uptime,
			avg(${serverSnapshots.memoryBytes})::float8 AS avg_memory,
			max(${serverSnapshots.cpuSeconds})::float8 AS max_cpu,
			min(${serverSnapshots.cpuSeconds})::float8 AS min_cpu
		FROM ${serverSnapshots}
		WHERE ${serverSnapshots.service} = ${slug}
			AND ${serverSnapshots.recordedAt} >= ${from.toISOString()}::timestamptz
		GROUP BY 1
		ORDER BY 1
	`)) as unknown as Record<string, unknown>[];

	const restartRows = (await db.execute(sql`
		SELECT count(*)::int AS restarts
		FROM (
			SELECT
				${serverSnapshots.running} AS running,
				lag(${serverSnapshots.running}) OVER (ORDER BY ${serverSnapshots.recordedAt}) AS previous
			FROM ${serverSnapshots}
			WHERE ${serverSnapshots.service} = ${slug}
				AND ${serverSnapshots.recordedAt} >= ${from.toISOString()}::timestamptz
		) transitions
		WHERE transitions.running AND transitions.previous = false
	`)) as unknown as Record<string, unknown>[];

	const buckets: HistoryBucket[] = aggregated.flatMap((row): HistoryBucket[] => {
		const start: Date | null = asDate(row.bucket_start);
		if (!start) return [];

		const maxCpu: number | null = asNumber(row.max_cpu);
		const minCpu: number | null = asNumber(row.min_cpu);

		return [
			{
				start,
				uptime: asNumber(row.uptime) ?? 0,
				samples: asNumber(row.samples) ?? 0,
				avgMemoryBytes: asNumber(row.avg_memory),
				// The CPU counter is cumulative and resets when the unit restarts, so a
				// negative delta means "restarted mid-bucket" rather than a real value
				cpuCores:
					maxCpu === null || minCpu === null ? null : Math.max(0, (maxCpu - minCpu) / bucketSeconds)
			}
		];
	});

	const samples: number = buckets.reduce((sum, b): number => sum + b.samples, 0);
	const weighted: number = buckets.reduce((sum, b): number => sum + b.uptime * b.samples, 0);

	return {
		slug,
		label: findGameServer(slug)?.label ?? slug,
		range,
		bucketSeconds,
		from,
		to,
		uptime: samples > 0 ? weighted / samples : 0,
		samples,
		restarts: asNumber(restartRows.at(0)?.restarts) ?? 0,
		buckets
	};
};
