import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { toast } from '$lib/client/components/toasts/toasts.svelte';
import { API } from '$lib/client/linker.client';

export interface Fields {
	email: string;
	password: string;
	login: () => Promise<undefined>;
}

export const NewLoginPage = (): Fields => {
	let email: string = $state('');
	let password: string = $state('');

	const login = async (): Promise<undefined> => {
		try {
			const { access } = await API.public.session.login.Login({
				email,
				password
			});
			API.setAccessToken(access);
			await goto(resolve('/dashboard'));
		} catch (e: unknown) {
			if (e instanceof Error) {
				toast({
					type: 'error',
					message: e.message
				});
			}
		}
	};

	return {
		set email(v: string) {
			email = v;
		},
		get email() {
			return email;
		},
		set password(v: string) {
			password = v;
		},
		get password() {
			return password;
		},
		login
	};
};
