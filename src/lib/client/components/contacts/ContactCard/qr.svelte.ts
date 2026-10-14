import { VCard } from '../vcard';
import type { CardState, Props, QRCode } from './models';
import { encodeQR } from './utils';

const EMPTY: QRCode = { path: '', size: 0, error: null };

export const createQR = (props: Props, state: CardState): QRCode => {
	// Only encoded once asked for, so opening a card stays cheap
	const qr: QRCode = $derived(state.showQR ? encodeQR(VCard.create.Text(props.contact)) : EMPTY);

	return {
		get path(): string {
			return qr.path;
		},
		get size(): number {
			return qr.size;
		},
		get error(): string | null {
			return qr.error;
		}
	};
};
