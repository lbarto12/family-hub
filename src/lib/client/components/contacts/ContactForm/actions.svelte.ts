import { toast } from '$lib/client/components/toasts/toasts.svelte';
import { API } from '$lib/client/linker.client';
import {
	ContactFieldsSchema,
	type ContactFields,
	type ContactResponse
} from '$lib/types/rpcs/private/contacts/contacts';
import type { ZodSafeParseResult } from 'zod';
import type { Actions, FormState, Props } from './models';
import { errorMessage } from './utils';

export const createActions = (props: Props, state: FormState): Actions => {
	return {
		// Validated here as well as on the server, so a typo gets a readable
		// message instead of the RPC layer's generic one
		submit: async (event: SubmitEvent): Promise<undefined> => {
			event.preventDefault();

			const parsed: ZodSafeParseResult<ContactFields> = ContactFieldsSchema.safeParse(state.fields);
			if (!parsed.success) {
				state.error = parsed.error.issues[0]?.message ?? 'Please check the details.';
				return;
			}

			state.saving = true;
			state.error = null;
			try {
				const saved: ContactResponse = props.contact
					? await API.private.contacts.update.ByID({ ...parsed.data, id: props.contact.id })
					: await API.private.contacts.create.New(parsed.data);
				props.onsaved(saved);
			} catch (e: unknown) {
				state.error = errorMessage(e);
			} finally {
				state.saving = false;
			}
		},
		remove: async (): Promise<undefined> => {
			const contact: ContactResponse | null = props.contact;
			if (!contact) return;
			if (!confirm(`Delete ${contact.firstName} for everyone in the household?`)) return;

			state.saving = true;
			try {
				await API.private.contacts.remove.ByID({ id: contact.id });
				toast({ type: 'toast', message: `${contact.firstName} was deleted` });
				props.ondeleted(contact.id);
			} catch (e: unknown) {
				state.error = errorMessage(e);
			} finally {
				state.saving = false;
			}
		},
		cancel: (): undefined => {
			props.oncancel();
		}
	};
};
