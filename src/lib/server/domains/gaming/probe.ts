import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { GAME_SERVERS } from '$lib/types/rpcs/private/gaming/servers';
import { gamingConfig } from './config';

const run = promisify(execFile);

export interface UnitState {
	readonly loadState: string;
	readonly activeState: string;
	readonly subState: string | null;
	readonly mainPID: number | null;
	readonly memoryBytes: number | null;
	readonly cpuSeconds: number | null;
	readonly tasks: number | null;
	readonly activeForSeconds: number | null;
}

export interface ProbeResult {
	readonly reachable: boolean;
	readonly error: string | null;
	/** Keyed by systemd unit name, e.g. "minecraft.service" */
	readonly units: ReadonlyMap<string, UnitState>;
}

const PROPERTIES = [
	'Id',
	'LoadState',
	'ActiveState',
	'SubState',
	'MainPID',
	'MemoryCurrent',
	'CPUUsageNSec',
	'TasksCurrent',
	'ActiveEnterTimestampMonotonic'
].join(',');

/**
 * `systemctl show` rather than `systemctl status`, because it emits key=value
 * pairs instead of prose. Every unit is asked for in one round trip, and
 * /proc/uptime rides along so "active for" can be derived from systemd's own
 * monotonic clock instead of a locale-formatted timestamp.
 */
const remoteCommand = (units: readonly string[]): string =>
	`systemctl show ${units.join(' ')} --property=${PROPERTIES}; echo; ` +
	`printf 'MonotonicNow=%s\\n' "$(cut -d' ' -f1 /proc/uptime)"`;

const parseBlock = (block: string): Map<string, string> => {
	const fields = new Map<string, string>();

	for (const line of block.split('\n')) {
		const eq = line.indexOf('=');
		if (eq <= 0) continue;
		fields.set(line.slice(0, eq), line.slice(eq + 1).trim());
	}

	return fields;
};

/** systemd writes "[not set]" or "infinity" where a counter is unavailable */
const num = (value: string | undefined): number | null => {
	if (value === undefined || value === '' || value === '[not set]' || value === 'infinity') {
		return null;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const positive = (value: string | undefined): number | null => {
	const parsed = num(value);
	return parsed !== null && parsed > 0 ? parsed : null;
};

export const Probe = async (): Promise<ProbeResult> => {
	const units: string[] = GAME_SERVERS.map((s): string => s.unit);
	const argv: string[] = [...gamingConfig.sshArgs, gamingConfig.target, remoteCommand(units)];

	let stdout: string;
	try {
		({ stdout } = await run(gamingConfig.sshBin, argv, {
			timeout: gamingConfig.probeTimeoutMs,
			killSignal: 'SIGKILL',
			maxBuffer: 1024 * 1024
		}));
	} catch (e: unknown) {
		return {
			reachable: false,
			error: e instanceof Error ? e.message : 'probe failed',
			units: new Map()
		};
	}

	const blocks: Map<string, string>[] = stdout
		.split(/\n\s*\n/)
		.map(parseBlock)
		.filter((b): boolean => b.size > 0);

	// Seconds since boot on the remote host, the reference for ActiveEnterTimestampMonotonic
	const monotonicNow: number | null =
		num(blocks.find((b): boolean => b.has('MonotonicNow'))?.get('MonotonicNow')) ?? null;

	const parsed = new Map<string, UnitState>();

	for (const block of blocks) {
		const id: string | undefined = block.get('Id');
		if (id === undefined) continue;

		const enteredMicros: number | null = positive(block.get('ActiveEnterTimestampMonotonic'));
		const activeState: string = block.get('ActiveState') ?? 'unknown';

		parsed.set(id, {
			loadState: block.get('LoadState') ?? 'unknown',
			activeState,
			subState: block.get('SubState') ?? null,
			mainPID: positive(block.get('MainPID')),
			memoryBytes: num(block.get('MemoryCurrent')),
			cpuSeconds: (() => {
				const nanos = num(block.get('CPUUsageNSec'));
				return nanos === null ? null : nanos / 1e9;
			})(),
			tasks: num(block.get('TasksCurrent')),
			activeForSeconds:
				enteredMicros !== null && monotonicNow !== null && activeState === 'active'
					? Math.max(0, monotonicNow - enteredMicros / 1e6)
					: null
		});
	}

	// A reachable host that returned nothing parseable is a broken probe, not an up host
	if (parsed.size === 0) {
		return { reachable: false, error: 'no unit state in probe output', units: parsed };
	}

	return { reachable: true, error: null, units: parsed };
};
