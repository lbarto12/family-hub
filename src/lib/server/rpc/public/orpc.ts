import { os } from '@orpc/server';
import type { RequestEvent } from '@sveltejs/kit';

export interface PublicORPCContext {
	event: RequestEvent;
}

const base = os.$context<PublicORPCContext>();

// Replace/add middlewares here
export const o = base.use(
	os.middleware(async ({ next }) => {
		return await next();
	})
);
