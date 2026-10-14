import { DisplayName } from '../format';
import type { ContactFields } from '$lib/types/rpcs/private/contacts/contacts';
import { EXTENSION, VERSION } from './constants';
import { escape, joinLines } from './utils';

export const Text = (contact: ContactFields): string => {
	const lines: string[] = [
		'BEGIN:VCARD',
		`VERSION:${VERSION}`,
		`N:${escape(contact.lastName)};${escape(contact.firstName)};;;`,
		`FN:${escape(DisplayName(contact))}`
	];

	if (contact.organization) lines.push(`ORG:${escape(contact.organization)}`);
	if (contact.phoneNumber) lines.push(`TEL;TYPE=CELL:${escape(contact.phoneNumber)}`);
	if (contact.email) lines.push(`EMAIL;TYPE=INTERNET:${escape(contact.email)}`);

	const address: string[] = [
		contact.street,
		contact.city,
		contact.region,
		contact.postalCode,
		contact.country
	];
	if (address.some(Boolean)) {
		lines.push(`ADR;TYPE=HOME:;;${address.map(escape).join(';')}`);
	}

	if (contact.notes) lines.push(`NOTE:${escape(contact.notes)}`);

	lines.push('END:VCARD');

	return joinLines(lines);
};

export const FileName = (contact: ContactFields): string => {
	const safe: string = DisplayName(contact)
		.replace(/[\\/:*?"<>|]/g, '')
		.trim();
	return (safe || 'contact') + EXTENSION;
};
