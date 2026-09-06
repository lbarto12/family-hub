import type { NewServerSnapshot } from '$lib/server/db/schemas';
import { GAME_SERVERS, type GameServerSlug } from '$lib/types/rpcs/private/gaming/servers';
import { gamingConfig } from './config';
import { Probe, type ProbeResult } from './probe';
import { Insert, Sweep } from './snapshots';

interface Runtime {
	started: boolean;
	polling: boolean;
	inFlight: boolean;
	latest: Map<GameServerSlug, NewServerSnapshot>;
	pollTimer: ReturnType<typeof setInterval> | null;
	sweepTimer: ReturnType<typeof setInterval> | null;
	lastError: string | null;
}

const KEY = Symbol.for('family-hub.gaming.poller');
const globals = globalThis as typeof globalThis & { [KEY]?: Runtime };

const runtime: Runtime = (globals[KEY] ??= {
	started: false,
	polling: false,
	inFlight: false,
	latest: new Map(),
	pollTimer: null,
	sweepTimer: null,
	lastError: null
});

const toRow = (
	slug: GameServerSlug,
	unit: string,
	result: ProbeResult,
	recordedAt: Date
): NewServerSnapshot => {
	const state = result.units.get(unit);

	if (!result.reachable || !state) {
		return {
			service: slug,
			state: 'unknown',
			subState: null,
			running: false,
			reachable: false,
			mainPID: null,
			memoryBytes: null,
			cpuSeconds: null,
			tasks: null,
			activeForSeconds: null,
			recordedAt
		};
	}

	return {
		service: slug,
		state: state.activeState,
		subState: state.subState,
		running: state.activeState === 'active',
		reachable: true,
		mainPID: state.mainPID,
		memoryBytes: state.memoryBytes,
		cpuSeconds: state.cpuSeconds,
		tasks: state.tasks,
		activeForSeconds: state.activeForSeconds,
		recordedAt
	};
};

const poll = async (): Promise<undefined> => {
	if (runtime.inFlight) return;
	runtime.inFlight = true;

	try {
		const result: ProbeResult = await Probe();
		const recordedAt = new Date();

		const rows: NewServerSnapshot[] = GAME_SERVERS.map((server): NewServerSnapshot =>
			toRow(server.slug, server.unit, result, recordedAt)
		);

		for (const row of rows) runtime.latest.set(row.service as GameServerSlug, row);
		runtime.lastError = result.error;

		await Insert(rows);
	} catch (e: unknown) {
		// The loop outlives any single failure: a dead DB or a dead tailnet should
		// not take the poller down with it
		runtime.lastError = e instanceof Error ? e.message : 'poll failed';
		console.error('[gaming] poll failed:', runtime.lastError);
	} finally {
		runtime.inFlight = false;
	}
};

const sweep = async (): Promise<undefined> => {
	try {
		const deleted: number = await Sweep();
		if (deleted > 0) {
			console.log(
				`[gaming] swept ${String(deleted)} snapshot(s) older than ${String(gamingConfig.retentionDays)}d`
			);
		}
	} catch (e: unknown) {
		console.error('[gaming] sweep failed:', e instanceof Error ? e.message : e);
	}
};

export const Start = (): undefined => {
	if (runtime.started) return;
	runtime.started = true;

	if (!gamingConfig.enabled) {
		console.log('[gaming] poller disabled (GAME_POLL_ENABLED=false)');
		return;
	}

	runtime.polling = true;
	console.log(
		`[gaming] polling ${gamingConfig.target} every ${String(gamingConfig.pollIntervalMs)}ms, keeping ${String(gamingConfig.retentionDays)}d`
	);

	void poll();
	void sweep();

	runtime.pollTimer = setInterval((): void => void poll(), gamingConfig.pollIntervalMs);
	runtime.sweepTimer = setInterval((): void => void sweep(), gamingConfig.sweepIntervalMs);

	// Timers alone would keep bun alive through a SIGTERM shutdown
	runtime.pollTimer.unref();
	runtime.sweepTimer.unref();
};

export const Stop = (): undefined => {
	if (runtime.pollTimer) clearInterval(runtime.pollTimer);
	if (runtime.sweepTimer) clearInterval(runtime.sweepTimer);
	runtime.pollTimer = null;
	runtime.sweepTimer = null;
	runtime.started = false;
	runtime.polling = false;
};

export const Snapshot = (): {
	polling: boolean;
	lastError: string | null;
	latest: ReadonlyMap<GameServerSlug, NewServerSnapshot>;
} => ({
	polling: runtime.polling,
	lastError: runtime.lastError,
	latest: runtime.latest
});
