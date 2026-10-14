import type { Contact } from '$lib/server/db/schemas';
import type { ContactResponse } from '$lib/types/rpcs/private/contacts/contacts';

export const ToResponse = (contact: Contact): ContactResponse => {
	return {
		id: contact.id,
		firstName: contact.firstName,
		lastName: contact.lastName,
		organization: contact.organization,
		email: contact.email,
		phoneNumber: contact.phoneNumber,
		street: contact.street,
		city: contact.city,
		region: contact.region,
		postalCode: contact.postalCode,
		country: contact.country,
		notes: contact.notes
	};
};
