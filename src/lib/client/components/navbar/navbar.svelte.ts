import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { toast } from '$lib/client/components/toasts/toasts.svelte';
import { API } from '$lib/client/linker.client';
import type { UserResponse } from '$lib/types/rpcs/private/users/users';

export interface Fields {
	readonly user: UserResponse | null;
	readonly initials: string;
	readonly menuOpen: boolean;
	readonly profileOpen: boolean;
	toggleMenu: () => undefined;
	toggleProfile: () => undefined;
	closeMenu: () => undefined;
	closeProfile: () => undefined;
	close: () => undefined;
	profile: () => Promise<undefined>;
	signOut: () => Promise<undefined>;
}

export const NewNavbar = (): Fields => {
	let user: UserResponse | null = $state(null);
	let menuOpen: boolean = $state(false);
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

	// The two dropdowns are mutually exclusive so a burger menu left open on a
	// narrow screen cannot sit underneath the profile menu
	const toggleMenu = (): undefined => {
		menuOpen = !menuOpen;
		profileOpen = false;
	};

	const toggleProfile = (): undefined => {
		profileOpen = !profileOpen;
		menuOpen = false;
	};

	const closeMenu = (): undefined => {
		menuOpen = false;
	};

	const closeProfile = (): undefined => {
		profileOpen = false;
	};

	const close = (): undefined => {
		menuOpen = false;
		profileOpen = false;
	};

	const profile = async (): Promise<undefined> => {
		close();
		await goto(resolve('/profile'));
	};

	const signOut = async (): Promise<undefined> => {
		close();

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
		get menuOpen() {
			return menuOpen;
		},
		get profileOpen() {
			return profileOpen;
		},
		toggleMenu,
		toggleProfile,
		closeMenu,
		closeProfile,
		close,
		profile,
		signOut
	};
};
