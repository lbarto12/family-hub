import { encode, type QrCodeGenerateResult } from 'uqr';
import type { QRCode } from './models';

// Safari cancels a download whose object URL is revoked in the same tick
const REVOKE_DELAY_MS = 1_000;

// Wide enough for a phone camera to lock on from across a table; the spec's
// four-module quiet zone is made up by padding around the image
const QR_BORDER = 2;

export const downloadText = (text: string, fileName: string, mimeType: string): undefined => {
	const url: string = URL.createObjectURL(new Blob([text], { type: mimeType }));

	const anchor: HTMLAnchorElement = document.createElement('a');
	anchor.href = url;
	anchor.download = fileName;
	anchor.click();

	setTimeout((): void => {
		URL.revokeObjectURL(url);
	}, REVOKE_DELAY_MS);
};

// Runs of dark modules become one rectangle each, which keeps the path short
// enough to render instantly even for a dense card
export const encodeQR = (text: string): QRCode => {
	let result: QrCodeGenerateResult;
	try {
		result = encode(text, { ecc: 'M', border: QR_BORDER });
	} catch {
		return { path: '', size: 0, error: 'This contact has too much detail to fit in a QR code.' };
	}

	let path = '';
	result.data.forEach((row: boolean[], y: number): void => {
		let x = 0;
		while (x < row.length) {
			if (!row[x]) {
				x++;
				continue;
			}
			const start: number = x;
			while (x < row.length && row[x]) x++;
			path += `M${String(start)} ${String(y)}h${String(x - start)}v1h-${String(x - start)}z`;
		}
	});

	return { path, size: result.size, error: null };
};
