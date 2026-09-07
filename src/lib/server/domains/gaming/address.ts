import { gamingConfig } from './config';

/**
 * The address players connect to.
 *
 * Resolved here on the server rather than in the browser: a browser lookup
 * reports whoever is *viewing* the page, so it is only right by accident when
 * the viewer happens to be on the same network. From a phone on cellular it
 * would confidently show the carrier's address instead. This host shares its
 * WAN with the game servers, so asking from here is the answer players need.
 */
let cached: { value: string | null; at: number } | null = null;

// A third party answers this, so only something that looks like an address is
// allowed through — a captive portal or an error page must not reach the UI
const LOOKS_LIKE_ADDRESS = /^[0-9a-f.:]{7,45}$/i;

const lookup = async (): Promise<string | null> => {
	try {
		const response = await fetch(gamingConfig.publicAddressUrl, {
			signal: AbortSignal.timeout(5_000),
			headers: { accept: 'text/plain' }
		});
		if (!response.ok) return null;

		const body: string = (await response.text()).trim();
		return LOOKS_LIKE_ADDRESS.test(body) ? body : null;
	} catch {
		// A WAN address that cannot be resolved is a missing field, not an error
		return null;
	}
};

export const Get = async (): Promise<string | null> => {
	if (gamingConfig.publicAddress) return gamingConfig.publicAddress;

	const now = Date.now();
	if (cached && now - cached.at < gamingConfig.publicAddressTtlMs) return cached.value;

	// Serve the stale value if the refresh fails, rather than blanking the field
	const value: string | null = (await lookup()) ?? cached?.value ?? null;
	cached = { value, at: now };
	return value;
};
