import type { ContactResponse } from '$lib/types/rpcs/private/contacts/contacts';
import { createActions } from './actions.svelte';
import { createDetails } from './details.svelte';
import type { Actions, CardState, ContactCard, Details, Props, QRCode } from './models';
import { createQR } from './qr.svelte';

export const useContactCardState = (props: Props): ContactCard => {
	const state: CardState = $state({ showQR: false });

	const details: Details = createDetails(props);
	const qr: QRCode = createQR(props, state);
	const actions: Actions = createActions(props, state);

	return {
		get contact(): ContactResponse {
			return props.contact;
		},
		details,
		get showQR(): boolean {
			return state.showQR;
		},
		qr,
		download: actions.download,
		toggleQR: actions.toggleQR,
		edit: actions.edit,
		close: actions.close
	};
};
