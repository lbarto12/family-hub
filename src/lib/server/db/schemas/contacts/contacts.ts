import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { common } from '../util/common';

/**
 * The household's shared address book. Every optional field is an empty string
 * rather than null, so the vCard and the form never have to tell the two apart.
 */
export const contacts = pgTable('contacts', {
	...common(),
	firstName: varchar('first_name').notNull(),
	lastName: varchar('last_name').notNull().default(''),
	organization: varchar('organization').notNull().default(''),
	email: varchar('email').notNull().default(''),
	phoneNumber: varchar('phone_number').notNull().default(''),
	street: varchar('street').notNull().default(''),
	city: varchar('city').notNull().default(''),
	region: varchar('region').notNull().default(''),
	postalCode: varchar('postal_code').notNull().default(''),
	country: varchar('country').notNull().default(''),
	notes: varchar('notes').notNull().default('')
});

export type Contact = typeof contacts.$inferSelect;
