import type { ContactFields, ContactResponse } from '$lib/types/rpcs/private/contacts/contacts';

export const toFields = (contact: ContactResponse | null): ContactFields => {
	return {
		firstName: contact?.firstName ?? '',
		lastName: contact?.lastName ?? '',
		organization: contact?.organization ?? '',
		email: contact?.email ?? '',
		phoneNumber: contact?.phoneNumber ?? '',
		street: contact?.street ?? '',
		city: contact?.city ?? '',
		region: contact?.region ?? '',
		postalCode: contact?.postalCode ?? '',
		country: contact?.country ?? '',
		notes: contact?.notes ?? ''
	};
};

export const errorMessage = (e: unknown): string => {
	return e instanceof Error ? e.message : 'Something went wrong.';
};
