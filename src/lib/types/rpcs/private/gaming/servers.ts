import z from 'zod';

/**
 * The registered game servers. Everything downstream — the systemd units the
 * poller probes, the badges on the dashboard, the detail routes — is driven
 * from this one list, so adding a server means adding an entry here and an
 * icon case in GameIcon.svelte.
 */
export const GAME_SERVERS = [
	{ slug: 'minecraft', label: 'Minecraft', unit: 'minecraft.service' },
	{ slug: 'valheim', label: 'Valheim', unit: 'valheim.service' }
] as const;

export type GameServer = (typeof GAME_SERVERS)[number];
export type GameServerSlug = GameServer['slug'];

export const GAME_SERVER_SLUGS = GAME_SERVERS.map((s): GameServerSlug => s.slug);

export const isGameServerSlug = (value: string): value is GameServerSlug =>
	(GAME_SERVER_SLUGS as readonly string[]).includes(value);

export const findGameServer = (slug: string): GameServer | undefined =>
	GAME_SERVERS.find((s): boolean => s.slug === slug);

export const GameServerSlugSchema = z.enum(
	GAME_SERVER_SLUGS as [GameServerSlug, ...GameServerSlug[]]
);

/** What the badge grid needs: live or not, plus enough detail for a tooltip. */
export const ServerStatusSchema = z.object({
	slug: GameServerSlugSchema,
	label: z.string(),
	running: z.boolean(),
	// systemd ActiveState, or 'unknown' when the host could not be reached
	state: z.string(),
	subState: z.string().nullable(),
	reachable: z.boolean(),
	memoryBytes: z.number().nullable(),
	cpuSeconds: z.number().nullable(),
	tasks: z.number().nullable(),
	activeForSeconds: z.number().nullable(),
	// null before the poller has completed its first pass
	recordedAt: z.date().nullable()
});

export const ServerStatusListSchema = z.object({
	servers: z.array(ServerStatusSchema),
	// Whether the background poller is running in this process at all
	polling: z.boolean()
});

export const HISTORY_RANGES = ['hour', 'day', 'week', 'month'] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

export const HistoryRequestSchema = z.object({
	slug: GameServerSlugSchema,
	range: z.enum(HISTORY_RANGES).default('day')
});

export const HistoryBucketSchema = z.object({
	start: z.date(),
	// Share of samples in the bucket where the unit was active, 0..1
	uptime: z.number(),
	samples: z.number(),
	avgMemoryBytes: z.number().nullable(),
	// Average cores consumed across the bucket, from the cumulative CPU counter
	cpuCores: z.number().nullable()
});

export const HistoryResponseSchema = z.object({
	slug: GameServerSlugSchema,
	label: z.string(),
	range: z.enum(HISTORY_RANGES),
	bucketSeconds: z.number(),
	from: z.date(),
	to: z.date(),
	// Uptime across the whole window, 0..1
	uptime: z.number(),
	samples: z.number(),
	restarts: z.number(),
	buckets: z.array(HistoryBucketSchema)
});

export type ServerStatus = z.infer<typeof ServerStatusSchema>;
export type ServerStatusList = z.infer<typeof ServerStatusListSchema>;
export type HistoryRequest = z.infer<typeof HistoryRequestSchema>;
export type HistoryBucket = z.infer<typeof HistoryBucketSchema>;
export type HistoryResponse = z.infer<typeof HistoryResponseSchema>;
