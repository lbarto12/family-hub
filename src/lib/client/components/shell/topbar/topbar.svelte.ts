import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { toast } from '$lib/client/components/toasts/toasts.svelte';
import { API } from '$lib/client/linker.client';
import type { UserResponse } from '$lib/types/rpcs/private/users/users';

export interface Fields {
	readonly user: UserResponse | null;
	readonly initials: string;
	readonly profileOpen: boolean;
	toggleProfile: () => undefined;
	closeProfile: () => undefined;
	profile: () => Promise<undefined>;
	signOut: () => Promise<undefined>;
}

export const NewTopbar = (): Fields => {
	let user: UserResponse | null = $state(null);
	let profileOpen: boolean = $state(false);

	const initials: string = $derived.by((): string => {
		if (!user) return '';
		return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
	});

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
		}
	};

	const toggleProfile = (): undefined => {
		profileOpen = !profileOpen;
	};

	const closeProfile = (): undefined => {
		profileOpen = false;
	};

	const profile = async (): Promise<undefined> => {
		closeProfile();
		await goto(resolve('/profile'));
	};

	const signOut = async (): Promise<undefined> => {
		closeProfile();

		try {
			await API.public.session.login.Logout();
		} catch (e: unknown) {
			if (e instanceof Error) {
				toast({
					type: 'error',
					message: e.message
				});
			}
		}

		API.setAccessToken(null);
		await goto(resolve('/session'));
	};

	void load();

	return {
		get user() {
			return user;
		},
		get initials() {
			return initials;
		},
		get profileOpen() {
			return profileOpen;
		},
		toggleProfile,
		closeProfile,
		profile,
		signOut
	};
};
