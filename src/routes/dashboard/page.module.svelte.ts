import { API } from '$lib/client/linker.client';

export interface Fields {
	/** null while unknown — the card shows nothing rather than a wrong count */
	readonly serversOnline: number | null;
	readonly serversTotal: number | null;
	load: () => Promise<undefined>;
}

export const NewDashboardPage = (): Fields => {
	let serversOnline: number | null = $state(null);
	let serversTotal: number | null = $state(null);

	// Deliberately quiet: this is a summary on a landing page, so a failure
	// leaves the count blank rather than throwing a toast at someone who did
	// not ask about game servers
	const load = async (): Promise<undefined> => {
		try {
			const result = await API.private.gaming.status.All();
			serversTotal = result.servers.length;
			serversOnline = result.servers.filter((s): boolean => s.running).length;
		} catch {
			serversOnline = null;
			serversTotal = null;
		}
	};

	void load();

	return {
		get serversOnline() {
			return serversOnline;
		},
		get serversTotal() {
			return serversTotal;
		},
		load
	};
};
