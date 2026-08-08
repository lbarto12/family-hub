import { os } from '@orpc/server';
import type { RequestEvent } from '@sveltejs/kit';

export interface PrivateORPCContext {
	event: RequestEvent;
}

const base = os.$context<PrivateORPCContext>();

// Replace/add middlewares here
export const o = base.use(
	os.middleware(async ({ next }) => {
		return await next();
	})
);
