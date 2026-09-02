import { createORPCClient, ORPCError } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { router as publicRouter } from '$lib/server/rpc/public/router';
import type { router as privateRouter } from '$lib/server/rpc/private/router';
import type { RouterClient } from '@orpc/server';

const publicLink = new RPCLink({
	url: () => `${window.location.origin}/rpc/public`
});
const pub: RouterClient<typeof publicRouter> = createORPCClient(publicLink);

let accessToken: string | null = null;
const setAccessToken = (t: string | null): void => {
	accessToken = t;
};

let refreshPromise: Promise<string | null> | null = null;
const refreshOnce = (): Promise<string | null> => {
	refreshPromise ??= (async (): Promise<string | null> => {
		try {
			const { access } = await pub.session.login.Refresh();
			setAccessToken(access);
			return access;
		} catch {
			setAccessToken(null);
			return null;
		} finally {
			refreshPromise = null;
		}
	})();
	return refreshPromise;
};

const privateLink = new RPCLink({
	url: () => `${window.location.origin}/rpc/private`,
	headers: () => (accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
	interceptors: [
		// eslint-disable-next-line @typescript-eslint/unbound-method
		async ({ next, path }) => {
			const isRefresh = path.join('.') === 'session.login.refresh';
			try {
				return await next();
			} catch (error) {
				const isAuthError = error instanceof ORPCError && error.code === 'UNAUTHORIZED';
				if (isRefresh || !isAuthError) throw error;
				const fresh = await refreshOnce();
				if (!fresh) throw error;
				return await next();
			}
		}
	]
});
const pri: RouterClient<typeof privateRouter> = createORPCClient(privateLink);

export const API = {
	public: pub,
	private: pri,
	setAccessToken
};
