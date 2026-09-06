import { toast } from '$lib/client/components/toasts/toasts.svelte';
import { API } from '$lib/client/linker.client';
import type { ServerStatus } from '$lib/types/rpcs/private/gaming/servers';

const REFRESH_MS = 5_000;

export interface Fields {
	readonly servers: ServerStatus[];
	readonly loading: boolean;
	readonly polling: boolean;
	/** Starts the refresh loop and returns its teardown, for use from $effect */
	start: () => () => undefined;
}

export const NewGamingPage = (): Fields => {
	let servers: ServerStatus[] = $state([]);
	let loading: boolean = $state(true);
	let polling: boolean = $state(false);
	// One toast for a broken connection, not one every five seconds
	let warned: boolean = $state(false);

	const load = async (): Promise<undefined> => {
		try {
			const result = await API.private.gaming.status.All();
			servers = result.servers;
			polling = result.polling;
			warned = false;
		} catch (e: unknown) {
			if (e instanceof Error && !warned) {
				warned = true;
				toast({ type: 'error', message: e.message });
			}
		} finally {
			loading = false;
		}
	};

	// Matches the server's own poll interval: the badges are never more than one
	// tick behind what the poller last saw
	const start = (): (() => undefined) => {
		void load();
		const timer = setInterval((): void => void load(), REFRESH_MS);
		return (): undefined => {
			clearInterval(timer);
		};
	};

	return {
		get servers() {
			return servers;
		},
		get loading() {
			return loading;
		},
		get polling() {
			return polling;
		},
		start
	};
};
