import { db } from '$lib/server/db';
import { contacts, type Contact } from '$lib/server/db/schemas';
import type { ContactListResponse } from '$lib/types/rpcs/private/contacts/contacts';
import { asc } from 'drizzle-orm';
import { ToResponse } from './convert';

export const All = async (): Promise<ContactListResponse> => {
	const rows: Contact[] = await db
		.select()
		.from(contacts)
		.orderBy(asc(contacts.firstName), asc(contacts.lastName));

	return { contacts: rows.map(ToResponse) };
};
