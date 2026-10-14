import { ContactsAPI } from '$lib/server/domains/contacts';
import { authed } from '$lib/server/rpc/private/orpc';
import {
	ContactCreateRequestSchema,
	ContactResponseSchema
} from '$lib/types/rpcs/private/contacts/contacts';

export const New = authed
	.input(ContactCreateRequestSchema)
	.output(ContactResponseSchema)
	.handler(({ input }) => ContactsAPI.create.New(input));
