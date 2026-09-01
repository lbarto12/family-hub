import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { common } from '../util/common';

export const users = pgTable('users', {
	...common(),
	email: varchar('email').notNull(),
	passwordHash: varchar('password_hash').notNull()
});

export type User = typeof users.$inferSelect;
