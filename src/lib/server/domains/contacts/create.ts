import { db } from '$lib/server/db';
import { contacts, type Contact } from '$lib/server/db/schemas';
import type {
	ContactCreateRequest,
	ContactResponse
} from '$lib/types/rpcs/private/contacts/contacts';
import { getFirst } from '../utils';
import { ToResponse } from './convert';

export const New = async (input: ContactCreateRequest): Promise<ContactResponse> => {
	const contact: Contact = await db
		.insert(contacts)
		.values({
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
			notes: input.notes
		})
		.returning()
		.then(getFirst);

	return ToResponse(contact);
};
