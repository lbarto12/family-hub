import type { ContactResponse } from '$lib/types/rpcs/private/contacts/contacts';

export type Modal =
	| { readonly mode: 'view'; readonly contact: ContactResponse }
	| { readonly mode: 'edit'; readonly contact: ContactResponse }
	| { readonly mode: 'create' };

export interface ContactGroup {
	readonly letter: string;
	readonly contacts: ContactResponse[];
}

export interface Fields {
	readonly loading: boolean;
	readonly total: number;
	query: string;
	readonly groups: ContactGroup[];
	readonly modal: Modal | null;
	view: (contact: ContactResponse) => undefined;
	edit: () => undefined;
	create: () => undefined;
	/** Steps out one level: an edit returns to its card, anything else closes */
	back: () => undefined;
	close: () => undefined;
	saved: (contact: ContactResponse) => undefined;
	deleted: (id: string) => undefined;
	keydown: (event: KeyboardEvent) => undefined;
}
