import {
	fillBuckets,
	type FilledBucket,
	type SeriesPoint,
	type StripBucket
} from '$lib/client/components/gaming/series';
import { toast } from '$lib/client/components/toasts/toasts.svelte';
import { API } from '$lib/client/linker.client';
import {
	findGameServer,
	type GameServerSlug,
	type HistoryRange,
	type HistoryResponse,
	type ServerStatus
} from '$lib/types/rpcs/private/gaming/servers';

const STATUS_REFRESH_MS = 5_000;
const HISTORY_REFRESH_MS = 60_000;

export interface Fields {
	readonly slug: GameServerSlug;
	readonly label: string;
	readonly status: ServerStatus | null;
	readonly history: HistoryResponse | null;
	readonly range: HistoryRange;
	readonly loading: boolean;
	readonly memory: SeriesPoint[];
	readonly cpu: SeriesPoint[];
	readonly strip: StripBucket[];
	setRange: (range: HistoryRange) => undefined;
	formatTime: (date: Date) => string;
	start: () => () => undefined;
}

const TIME_FORMATS: Record<HistoryRange, Intl.DateTimeFormatOptions> = {
	hour: { hour: '2-digit', minute: '2-digit' },
	day: { hour: '2-digit', minute: '2-digit' },
	week: { weekday: 'short', hour: '2-digit' },
	month: { month: 'short', day: 'numeric' }
};

export const NewServerPage = (slug: GameServerSlug): Fields => {
	let status: ServerStatus | null = $state(null);
	let history: HistoryResponse | null = $state(null);
	let range: HistoryRange = $state('day');
	let loading: boolean = $state(true);
	let warned: boolean = $state(false);

	const label: string = findGameServer(slug)?.label ?? slug;

	const fail = (e: unknown): undefined => {
		if (e instanceof Error && !warned) {
			warned = true;
			toast({ type: 'error', message: e.message });
		}
	};

	const loadStatus = async (): Promise<undefined> => {
		try {
			const result = await API.private.gaming.status.All();
			status = result.servers.find((s): boolean => s.slug === slug) ?? null;
			warned = false;
		} catch (e: unknown) {
			fail(e);
		}
	};

	const loadHistory = async (): Promise<undefined> => {
		try {
			history = await API.private.gaming.history.ForService({ slug, range });
		} catch (e: unknown) {
			fail(e);
		} finally {
			loading = false;
		}
	};

	const setRange = (next: HistoryRange): undefined => {
		if (next === range) return;
		range = next;
		loading = true;
		void loadHistory();
	};

	const filled: FilledBucket[] = $derived(fillBuckets(history));

	const memory: SeriesPoint[] = $derived(
		filled.map((f): SeriesPoint => ({ start: f.start, value: f.bucket?.avgMemoryBytes ?? null }))
	);

	const cpu: SeriesPoint[] = $derived(
		filled.map((f): SeriesPoint => ({ start: f.start, value: f.bucket?.cpuCores ?? null }))
	);

	const strip: StripBucket[] = $derived(
		filled.map((f): StripBucket => ({ start: f.start, uptime: f.bucket?.uptime ?? null }))
	);

	const formatTime = (date: Date): string =>
		new Intl.DateTimeFormat(undefined, TIME_FORMATS[range]).format(date);

	const start = (): (() => undefined) => {
		void loadStatus();
		void loadHistory();

		const statusTimer = setInterval((): void => void loadStatus(), STATUS_REFRESH_MS);
		const historyTimer = setInterval((): void => void loadHistory(), HISTORY_REFRESH_MS);

		return (): undefined => {
			clearInterval(statusTimer);
			clearInterval(historyTimer);
		};
	};

	return {
		slug,
		label,
		get status() {
			return status;
		},
		get history() {
			return history;
		},
		get range() {
			return range;
		},
		get loading() {
			return loading;
		},
		get memory() {
			return memory;
		},
		get cpu() {
			return cpu;
		},
		get strip() {
			return strip;
		},
		setRange,
		formatTime,
		start
	};
};
