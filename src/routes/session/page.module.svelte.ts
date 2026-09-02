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
		const { access } = await API.public.session.login.Login({
			email,
			password
		});

		API.setAccessToken(access);
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
