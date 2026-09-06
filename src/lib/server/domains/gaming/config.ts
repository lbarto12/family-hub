import { env } from '$env/dynamic/private';

const int = (value: string | undefined, fallback: number): number => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const bool = (value: string | undefined, fallback: boolean): boolean => {
	if (value === undefined || value === '') return fallback;
	return value === 'true' || value === '1';
};

/**
 * The probe shells out rather than opening its own SSH connection, so the
 * transport is whatever the host already has configured. The default assumes
 * tailscale SSH; swapping to a plain keyed SSH is
 *
 *   GAME_SSH_BIN=ssh
 *   GAME_SSH_ARGS=-o BatchMode=yes -o ConnectTimeout=5
 */
export const gamingConfig = {
	enabled: bool(env.GAME_POLL_ENABLED, true),
	sshBin: env.GAME_SSH_BIN ?? 'tailscale',
	sshArgs: (env.GAME_SSH_ARGS ?? 'ssh').split(' ').filter((a): boolean => a !== ''),
	target: env.GAME_SSH_TARGET ?? 'user@gaming',
	pollIntervalMs: int(env.GAME_POLL_INTERVAL_MS, 5_000),
	// Kept under the poll interval so a hung probe cannot queue up behind itself
	probeTimeoutMs: int(env.GAME_PROBE_TIMEOUT_MS, 4_000),
	retentionDays: int(env.GAME_RETENTION_DAYS, 90),
	sweepIntervalMs: int(env.GAME_SWEEP_INTERVAL_MS, 60 * 60 * 1_000)
};
