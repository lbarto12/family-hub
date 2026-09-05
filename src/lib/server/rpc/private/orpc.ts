import { verifyAccessToken } from '$lib/server/domains/sessions/utils';
import { ROLES, type Role } from '$lib/types/rpcs/private/users/users';
import { ORPCError, os } from '@orpc/server';
import type { RequestEvent } from '@sveltejs/kit';
import type { JWTPayload } from 'jose';

export interface PrivateORPCContext {
	userID: string;
	role: Role;
	event: RequestEvent;
}

const base = os.$context<PrivateORPCContext>();

// Replace/add middlewares here
export const o = base.use(
	os.middleware(async ({ next }) => {
		return await next();
	})
);

const extractBearer = (req: Request): string | null => {
	const header = req.headers.get('authorization');
	return header?.startsWith('Bearer ') ? header.slice(7) : null;
};

const parseRole = (value: unknown): Role => {
	if (typeof value === 'string' && (ROLES as readonly string[]).includes(value)) {
		return value as Role;
	}
	throw new ORPCError('UNAUTHORIZED', { message: 'invalid role claim' });
};

export const authed = o.use(async ({ context, next }) => {
	const token: string | null = extractBearer(context.event.request);
	if (!token) throw new ORPCError('UNAUTHORIZED', { message: 'no access token found' });

	let payload: JWTPayload;
	try {
		payload = await verifyAccessToken(token);
	} catch {
		throw new ORPCError('UNAUTHORIZED', { message: 'invalid or expired access token' });
	}

	const userID: string | undefined = payload.sub;
	if (!userID) throw new ORPCError('UNAUTHORIZED', { message: 'no userID found in access token' });

	return next({
		context: {
			userID,
			role: parseRole(token),
			event: context.event
		}
	});
});

export const withRole = (...permit: Role[]) =>
	authed.use(async ({ context, next }) => {
		if (!permit.includes(context.role)) {
			throw new ORPCError('FORBIDDEN', { message: 'missing required permissions' });
		}
		return next({ context });
	});
