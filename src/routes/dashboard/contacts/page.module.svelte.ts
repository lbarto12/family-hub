import { toast } from '$lib/client/components/toasts/toasts.svelte';
import { API } from '$lib/client/linker.client';
import type { ContactResponse } from '$lib/types/rpcs/private/contacts/contacts';
import type { ContactGroup, Fields, Modal } from './models';
import { groupByLetter, matches, sortContacts } from './utils';

export const NewContactsPage = (): Fields => {
	let contacts: ContactResponse[] = $state([]);
	let loading: boolean = $state(true);
	let query: string = $state('');
	let modal: Modal | null = $state(null);

	const groups: ContactGroup[] = $derived(
		groupByLetter(contacts.filter((c: ContactResponse): boolean => matches(c, query)))
	);

	const load = async (): Promise<undefined> => {
		try {
			const result = await API.private.contacts.list.All();
			contacts = result.contacts;
		} catch (e: unknown) {
			if (e instanceof Error) toast({ type: 'error', message: e.message });
		} finally {
			loading = false;
		}
	};

	const close = (): undefined => {
		modal = null;
	};

	const back = (): undefined => {
		modal = modal?.mode === 'edit' ? { mode: 'view', contact: modal.contact } : null;
	};

	void load();

	return {
		get loading() {
			return loading;
		},
		get total() {
			return contacts.length;
		},
		get query() {
			return query;
		},
		set query(value: string) {
			query = value;
		},
		get groups() {
			return groups;
		},
		get modal() {
			return modal;
		},
		view: (contact: ContactResponse): undefined => {
			modal = { mode: 'view', contact };
		},
		edit: (): undefined => {
			if (modal?.mode === 'view') modal = { mode: 'edit', contact: modal.contact };
		},
		create: (): undefined => {
			modal = { mode: 'create' };
		},
		back,
		close,
		saved: (contact: ContactResponse): undefined => {
			contacts = sortContacts([
				...contacts.filter((c: ContactResponse): boolean => c.id !== contact.id),
				contact
			]);
			modal = { mode: 'view', contact };
		},
		deleted: (id: string): undefined => {
			contacts = contacts.filter((c: ContactResponse): boolean => c.id !== id);
			modal = null;
		},
		keydown: (event: KeyboardEvent): undefined => {
			if (event.key === 'Escape' && modal) back();
		}
	};
};
