import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { common } from '../util/common';
import { roles } from './roles';

export const users = pgTable('users', {
	...common(),
	email: varchar('email').notNull(),
	passwordHash: varchar('password_hash').notNull(),
	role: roles('role').notNull().default('user')
});

export type User = typeof users.$inferSelect;
