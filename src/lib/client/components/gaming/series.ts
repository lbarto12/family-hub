import type { HistoryBucket, HistoryResponse } from '$lib/types/rpcs/private/gaming/servers';

export interface SeriesPoint {
	readonly start: Date;
	/** null marks a gap: no samples in that bucket, so nothing is interpolated */
	readonly value: number | null;
}

export interface StripBucket {
	readonly start: Date;
	/** null when no samples landed in the bucket */
	readonly uptime: number | null;
}

export interface FilledBucket {
	readonly start: Date;
	readonly bucket: HistoryBucket | undefined;
}

/**
 * The query only returns buckets that hold samples. Walking the whole window
 * instead means a stretch with no data reads as a gap, rather than as a straight
 * line drawn between the samples either side of it.
 */
export const fillBuckets = (history: HistoryResponse | null): FilledBucket[] => {
	if (!history) return [];

	const step = history.bucketSeconds * 1_000;
	const byStart = new Map<number, HistoryBucket>(
		history.buckets.map((b): [number, HistoryBucket] => [b.start.getTime(), b])
	);

	const first = Math.floor(history.from.getTime() / step) * step;
	const last = Math.floor(history.to.getTime() / step) * step;
	const out: FilledBucket[] = [];

	for (let t = first; t <= last; t += step) {
		out.push({ start: new Date(t), bucket: byStart.get(t) });
	}

	return out;
};

/** 1 / 2 / 2.5 / 5 / 10 x 10^n, so gridlines land on readable numbers */
export const niceMax = (value: number): number => {
	if (!Number.isFinite(value) || value <= 0) return 1;

	const magnitude = 10 ** Math.floor(Math.log10(value));
	const scaled = value / magnitude;
	const step = [1, 2, 2.5, 5, 10].find((s): boolean => scaled <= s) ?? 10;

	return step * magnitude;
};

export const formatBytes = (bytes: number | null): string => {
	if (bytes === null) return '—';
	if (bytes < 1024) return `${bytes.toFixed(0)} B`;

	const units = ['KiB', 'MiB', 'GiB', 'TiB'];
	let value = bytes / 1024;
	let unit = 0;

	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}

	return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
};

export const formatCores = (cores: number | null): string => {
	if (cores === null) return '—';
	// Idle servers sit near zero, where two decimals collapses every axis tick to
	// the same "0.00" — scale the precision to the magnitude instead
	const digits = cores >= 1 ? 1 : cores >= 0.1 ? 2 : 3;
	return `${cores.toFixed(digits)} cores`;
};

/**
 * Bytes read in powers of two, so a decimal ceiling like 2e9 shows up as an
 * awkward "1.9 GiB". Snapping to 1 / 1.5 / 2 x 2^n keeps axis labels round.
 */
export const niceMaxBytes = (value: number): number => {
	if (!Number.isFinite(value) || value <= 0) return 1024;

	const base = 2 ** Math.floor(Math.log2(value));
	const step = [1, 1.5, 2].find((s): boolean => value <= s * base) ?? 2;

	return step * base;
};

export const formatPercent = (ratio: number): string => `${(ratio * 100).toFixed(2)}%`;

export const formatDuration = (seconds: number | null): string => {
	if (seconds === null) return '—';

	const days = Math.floor(seconds / 86_400);
	const hours = Math.floor((seconds % 86_400) / 3_600);
	const minutes = Math.floor((seconds % 3_600) / 60);

	if (days > 0) return `${String(days)}d ${String(hours)}h`;
	if (hours > 0) return `${String(hours)}h ${String(minutes)}m`;
	return `${String(minutes)}m`;
};
