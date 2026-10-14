import { db } from '$lib/server/db';
import { contacts, type Contact } from '$lib/server/db/schemas';
import type {
	ContactRemoveRequest,
	ContactResponse
} from '$lib/types/rpcs/private/contacts/contacts';
import { eq } from 'drizzle-orm';
import { getFirst } from '../utils';
import { ToResponse } from './convert';

export const ByID = async (input: ContactRemoveRequest): Promise<ContactResponse> => {
	const contact: Contact = await db
		.delete(contacts)
		.where(eq(contacts.id, input.id))
		.returning()
		.then(getFirst);

	return ToResponse(contact);
};
