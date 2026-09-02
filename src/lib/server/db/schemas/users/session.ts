import { boolean, index, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { common } from '../util/common';
import { users } from './users';
import { timestamp } from 'drizzle-orm/pg-core';

export const refreshTokens = pgTable(
	'refresh_tokens',
	{
		...common(),
		userID: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'no action' }),
		familyID: uuid('family_id').notNull(),
		hash: varchar('token').notNull(),
		used: boolean('used').notNull().default(false),
		revoked: boolean('revoked').notNull().default(false),
		expiresAt: timestamp('expires_t', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [
		uniqueIndex('index_refresh_token_hash').on(table.hash),
		index('index_refresh_token_family').on(table.familyID),
		index('index_refresh_token_user').on(table.userID)
	]
);

export type RefreshToken = typeof refreshTokens.$inferSelect;
