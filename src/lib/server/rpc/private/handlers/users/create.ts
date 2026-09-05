import { UsersAPI } from '$lib/server/domains/users';
import { UserCreateRequestSchema, UserResponseSchema } from '$lib/types/rpcs/private/users/users';
import { withRole } from '$lib/server/rpc/private/orpc';

export const New = withRole('admin')
	.input(UserCreateRequestSchema)
	.output(UserResponseSchema)
	.handler(({ input }) => UsersAPI.create.New(input));
