import { MIME_TYPE, VCard } from '../vcard';
import type { Actions, CardState, Props } from './models';
import { downloadText } from './utils';

export const createActions = (props: Props, state: CardState): Actions => {
	return {
		download: (): undefined => {
			downloadText(
				VCard.create.Text(props.contact),
				VCard.create.FileName(props.contact),
				MIME_TYPE
			);
		},
		toggleQR: (): undefined => {
			state.showQR = !state.showQR;
		},
		edit: (): undefined => {
			props.onedit();
		},
		close: (): undefined => {
			props.onclose();
		}
	};
};
