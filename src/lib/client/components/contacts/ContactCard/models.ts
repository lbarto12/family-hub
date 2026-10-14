import type { ContactResponse } from '$lib/types/rpcs/private/contacts/contacts';

export interface Props {
	contact: ContactResponse;
	onedit: () => undefined;
	onclose: () => undefined;
}

export interface CardState {
	showQR: boolean;
}

export interface Details {
	readonly name: string;
	readonly initials: string;
	readonly address: string[];
	/** null when there is no number to dial */
	readonly callHref: string | null;
}

export interface QRCode {
	/** One SVG path for every dark module, in module units */
	readonly path: string;
	readonly size: number;
	/** Set when the card is too large to fit in a QR code */
	readonly error: string | null;
}

export interface Actions {
	download: () => undefined;
	toggleQR: () => undefined;
	edit: () => undefined;
	close: () => undefined;
}

export interface ContactCard {
	readonly contact: ContactResponse;
	readonly details: Details;
	readonly showQR: boolean;
	readonly qr: QRCode;
	download: () => undefined;
	toggleQR: () => undefined;
	edit: () => undefined;
	close: () => undefined;
}
