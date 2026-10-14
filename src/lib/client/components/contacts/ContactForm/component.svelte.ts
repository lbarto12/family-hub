import type { ContactFields } from '$lib/types/rpcs/private/contacts/contacts';
import { createActions } from './actions.svelte';
import type { Actions, ContactForm, FieldSection, FormState, Props } from './models';
import { toFields } from './utils';

const SECTIONS: readonly FieldSection[] = [
	{
		title: 'Name',
		fields: [
			{ key: 'firstName', label: 'First name', type: 'text', wide: false },
			{ key: 'lastName', label: 'Last name', type: 'text', wide: false },
			{ key: 'organization', label: 'Company', type: 'text', wide: true }
		]
	},
	{
		title: 'Reach',
		fields: [
			{ key: 'phoneNumber', label: 'Phone', type: 'tel', wide: false },
			{ key: 'email', label: 'Email', type: 'email', wide: false }
		]
	},
	{
		title: 'Address',
		fields: [
			{ key: 'street', label: 'Street', type: 'text', wide: true },
			{ key: 'city', label: 'City', type: 'text', wide: false },
			{ key: 'region', label: 'Province / state', type: 'text', wide: false },
			{ key: 'postalCode', label: 'Postal code', type: 'text', wide: false },
			{ key: 'country', label: 'Country', type: 'text', wide: false }
		]
	}
];

export const useContactFormState = (props: Props): ContactForm => {
	// Seeded once: the form edits a copy, and only a successful save hands it back
	const state: FormState = $state({
		fields: toFields(props.contact),
		saving: false,
		error: null
	});

	const actions: Actions = createActions(props, state);

	return {
		sections: SECTIONS,
		get fields(): ContactFields {
			return state.fields;
		},
		get isNew(): boolean {
			return props.contact === null;
		},
		get saving(): boolean {
			return state.saving;
		},
		get error(): string | null {
			return state.error;
		},
		submit: actions.submit,
		remove: actions.remove,
		cancel: actions.cancel
	};
};
