import {
	GAME_SERVERS,
	type GameServerSlug,
	type ServerStatus,
	type ServerStatusList
} from '$lib/types/rpcs/private/gaming/servers';
import { Snapshot } from './poller';
import { Latest } from './snapshots';

interface Reading {
	readonly state: string;
	readonly subState: string | null;
	readonly running: boolean;
	readonly reachable: boolean;
	readonly memoryBytes: number | null;
	readonly cpuSeconds: number | null;
	readonly tasks: number | null;
	readonly activeForSeconds: number | null;
	readonly recordedAt: Date | null;
}

const UNPOLLED: Reading = {
	state: 'unknown',
	subState: null,
	running: false,
	reachable: false,
	memoryBytes: null,
	cpuSeconds: null,
	tasks: null,
	activeForSeconds: null,
	recordedAt: null
};

export const All = async (): Promise<ServerStatusList> => {
	const snapshot = Snapshot();
	const persisted = snapshot.latest.size === 0 ? await Latest() : null;

	const readingFor = (slug: GameServerSlug): Reading => {
		const live = snapshot.latest.get(slug);
		if (live) {
			return {
				state: live.state,
				subState: live.subState ?? null,
				running: live.running,
				reachable: live.reachable ?? false,
				memoryBytes: live.memoryBytes ?? null,
				cpuSeconds: live.cpuSeconds ?? null,
				tasks: live.tasks ?? null,
				activeForSeconds: live.activeForSeconds ?? null,
				recordedAt: live.recordedAt
			};
		}

		const row = persisted?.get(slug);
		if (!row) return UNPOLLED;

		return {
			state: row.state,
			subState: row.subState,
			running: row.running,
			reachable: row.reachable,
			memoryBytes: row.memoryBytes,
			cpuSeconds: row.cpuSeconds,
			tasks: row.tasks,
			activeForSeconds: row.activeForSeconds,
			recordedAt: row.recordedAt
		};
	};

	return {
		polling: snapshot.polling,
		servers: GAME_SERVERS.map((server): ServerStatus => {
			const reading: Reading = readingFor(server.slug);
			return { slug: server.slug, label: server.label, ...reading };
		})
	};
};
