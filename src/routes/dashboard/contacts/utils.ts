import type { ContactResponse } from '$lib/types/rpcs/private/contacts/contacts';
import type { ContactGroup } from './models';

const OTHER_LETTER = '#';

const digitsOf = (value: string): string => {
	return value.replace(/\D/g, '');
};

export const sortContacts = (contacts: ContactResponse[]): ContactResponse[] => {
	return contacts.toSorted(
		(a, b): number =>
			a.firstName.localeCompare(b.firstName, undefined, { sensitivity: 'base' }) ||
			a.lastName.localeCompare(b.lastName, undefined, { sensitivity: 'base' })
	);
};

// A number typed as "555 1234" should find "(555) 123-4" style entries too, so
// digit-only queries compare digits to digits
export const matches = (contact: ContactResponse, query: string): boolean => {
	const needle: string = query.trim().toLowerCase();
	if (!needle) return true;

	const haystack: string = [
		contact.firstName,
		contact.lastName,
		`${contact.firstName} ${contact.lastName}`,
		contact.organization,
		contact.email,
		contact.phoneNumber,
		contact.city
	]
		.join('\n')
		.toLowerCase();
	if (haystack.includes(needle)) return true;

	const digits: string = digitsOf(needle);
	return (
		/^[\d\s()+.-]+$/.test(needle) &&
		digits.length > 0 &&
		digitsOf(contact.phoneNumber).includes(digits)
	);
};

export const groupByLetter = (contacts: ContactResponse[]): ContactGroup[] => {
	const groups: ContactGroup[] = [];

	for (const contact of contacts) {
		const first: string = contact.firstName.charAt(0).toUpperCase();
		const letter: string = /\p{L}/u.test(first) ? first : OTHER_LETTER;
		const last: ContactGroup | undefined = groups.at(-1);

		if (last?.letter === letter) last.contacts.push(contact);
		else groups.push({ letter, contacts: [contact] });
	}

	return groups;
};
