import { UsersAPI } from '$lib/server/domains/users';
import { authed } from '$lib/server/rpc/private/orpc';
import { UserResponseSchema, UserUpdateRequestSchema } from '$lib/types/rpcs/private/users/users';
import { ORPCError } from '@orpc/client';

export const ByID = authed
	.input(UserUpdateRequestSchema)
	.output(UserResponseSchema)
	.handler(async ({ input, context }) => {
		if (context.role !== 'admin' && input.userID !== context.userID) {
			throw new ORPCError('FORBIDDEN', {
				message: 'a user request may not modify a different user'
			});
		}

		return await UsersAPI.update.ByID(input);
	});
