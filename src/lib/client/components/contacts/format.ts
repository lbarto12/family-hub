import type { ContactFields } from '$lib/types/rpcs/private/contacts/contacts';

export const DisplayName = (contact: Pick<ContactFields, 'firstName' | 'lastName'>): string => {
	return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
};

export const Initials = (contact: Pick<ContactFields, 'firstName' | 'lastName'>): string => {
	return (contact.firstName.charAt(0) + contact.lastName.charAt(0)).toUpperCase();
};

// Dialers choke on the spaces, dashes and brackets people type for readability
export const TelHref = (phoneNumber: string): string => {
	return `tel:${phoneNumber.replace(/[^\d+*#]/g, '')}`;
};

export const AddressLines = (
	contact: Pick<ContactFields, 'street' | 'city' | 'region' | 'postalCode' | 'country'>
): string[] => {
	const locality: string = [
		[contact.city, contact.region].filter(Boolean).join(', '),
		contact.postalCode
	]
		.filter(Boolean)
		.join(' ');

	return [contact.street, locality, contact.country].filter(Boolean);
};
