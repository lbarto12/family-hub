import {
	bigint,
	boolean,
	doublePrecision,
	index,
	integer,
	pgTable,
	timestamp,
	varchar
} from 'drizzle-orm/pg-core';
import { common } from '../util/common';

/**
 * One row per game server per poll. The poller writes every service in a single
 * poll with the same recordedAt, so a poll can be reassembled exactly, and
 * sweeps rows past the retention window on its own schedule.
 */
export const serverSnapshots = pgTable(
	'server_snapshots',
	{
		...common(),
		// The registry slug rather than the unit name, so renaming a systemd unit
		// does not orphan its history
		service: varchar('service').notNull(),
		// systemd ActiveState: active | inactive | failed | activating | deactivating
		state: varchar('state').notNull(),
		subState: varchar('sub_state'),
		// Denormalised from state so uptime aggregates stay simple
		running: boolean('running').notNull(),
		// false when the unit is missing on the host, or the host is unreachable
		reachable: boolean('reachable').notNull().default(true),
		mainPID: integer('main_pid'),
		memoryBytes: bigint('memory_bytes', { mode: 'number' }),
		// Cumulative CPU since the unit started; the graphs difference it per bucket
		cpuSeconds: doublePrecision('cpu_seconds'),
		tasks: integer('tasks'),
		// Seconds the unit had been active at poll time, from systemd's own clock
		activeForSeconds: doublePrecision('active_for_seconds'),
		recordedAt: timestamp('recorded_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [index('index_server_snapshots_service_time').on(table.service, table.recordedAt)]
);

export type ServerSnapshot = typeof serverSnapshots.$inferSelect;
export type NewServerSnapshot = typeof serverSnapshots.$inferInsert;
