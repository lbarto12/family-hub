import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { common } from '../util/common';
import { users } from './users';

export const sessions = pgTable('sessions', {
	...common(),
	userID: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'no action' })
});

export type Session = typeof sessions.$inferSelect;
