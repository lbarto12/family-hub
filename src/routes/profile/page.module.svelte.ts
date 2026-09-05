import { toast } from '$lib/client/components/toasts/toasts.svelte';
import { API } from '$lib/client/linker.client';
import type { UserResponse } from '$lib/types/rpcs/private/users/users';

export interface Fields {
	readonly user: UserResponse | null;
	readonly loading: boolean;
}

export const NewProfilePage = (): Fields => {
	let user: UserResponse | null = $state(null);
	let loading: boolean = $state(true);

	const load = async (): Promise<undefined> => {
		try {
			user = await API.private.users.get.Me();
		} catch (e: unknown) {
			if (e instanceof Error) {
				toast({
					type: 'error',
					message: e.message
				});
			}
		} finally {
			loading = false;
		}
	};

	void load();

	return {
		get user() {
			return user;
		},
		get loading() {
			return loading;
		}
	};
};
