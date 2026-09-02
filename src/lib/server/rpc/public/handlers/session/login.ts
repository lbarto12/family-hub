import { SessionsAPI } from '$lib/server/domains/sessions';
import { o } from '$lib/server/rpc/public/orpc';
import {
	SessionBundleSchema,
	SessionLoginRequestSchema,
	type SessionBundle
} from '$lib/types/rpcs/public/session/session';

export const Login = o
	.input(SessionLoginRequestSchema)
	.output(SessionBundleSchema)
	.handler(async ({ input, context }): Promise<SessionBundle> => {
		const bundle: SessionBundle = await SessionsAPI.login.Login(input);

		context.event.cookies.set('refresh', bundle.refresh, {
			httpOnly: true,
			secure: false,
			sameSite: 'strict',
			path: '/rpc/public/session',
			maxAge: 30 * 24 * 60 * 60 * 1000
		});

		return bundle;
	});

export const Refresh = o
	.output(SessionBundleSchema)
	.handler(async ({ context }): Promise<SessionBundle> => {
		const bundle: SessionBundle = await SessionsAPI.login.Refresh(context);

		context.event.cookies.set('refresh', bundle.refresh, {
			httpOnly: true,
			secure: false,
			sameSite: 'strict',
			path: '/rpc/public/session',
			maxAge: 30 * 24 * 60 * 60 * 1000
		});

		return bundle;
	});
