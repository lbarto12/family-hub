import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

import { router as publicRouter } from '$lib/server/rpc/public/router';
import { router as privateRouter } from '$lib/server/rpc/private/router';
import type { RouterClient } from '@orpc/server';

const publicLink = new RPCLink({
	url: `${window.location.origin}/rpc/public`
});

const privateLink = new RPCLink({
	url: `${window.location.origin}/rpc/private`
});

const pub: RouterClient<typeof publicRouter> = createORPCClient(publicLink);
const pri: RouterClient<typeof privateRouter> = createORPCClient(privateLink);

export const API = {
	public: pub,
	private: pri
};
