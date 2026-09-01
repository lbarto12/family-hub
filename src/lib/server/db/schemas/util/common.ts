import { timestamp, uuid } from 'drizzle-orm/pg-core';

export const common = () => {
	return {
		id: uuid('id')
			.primaryKey()
			.notNull()
			.$defaultFn(() => Bun.randomUUIDv7()),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
	};
};
