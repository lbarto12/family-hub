import { UsersAPI } from '$lib/server/domains/users';
import { authed } from '$lib/server/rpc/private/orpc';
import { UserResponseSchema } from '$lib/types/rpcs/private/users/users';

export const Me = authed
	.output(UserResponseSchema)
	.handler(({ context }) => UsersAPI.get.ByID(context.userID));
