import { db } from '$lib/server/db';
import { contacts, type Contact } from '$lib/server/db/schemas';
import type {
	ContactResponse,
	ContactUpdateRequest
} from '$lib/types/rpcs/private/contacts/contacts';
import { eq } from 'drizzle-orm';
import { getFirst } from '../utils';
import { ToResponse } from './convert';

export const ByID = async (input: ContactUpdateRequest): Promise<ContactResponse> => {
	const contact: Contact = await db
		.update(contacts)
		.set({
			firstName: input.firstName,
			lastName: input.lastName,
			organization: input.organization,
			email: input.email.toLowerCase(),
			phoneNumber: input.phoneNumber,
			street: input.street,
			city: input.city,
			region: input.region,
			postalCode: input.postalCode,
			country: input.country,
			notes: input.notes,
			updatedAt: new Date()
		})
		.where(eq(contacts.id, input.id))
		.returning()
		.then(getFirst);

	return ToResponse(contact);
};
