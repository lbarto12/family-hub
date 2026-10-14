import { ContactsAPI } from '$lib/server/domains/contacts';
import { authed } from '$lib/server/rpc/private/orpc';
import {
	ContactRemoveRequestSchema,
	ContactResponseSchema
} from '$lib/types/rpcs/private/contacts/contacts';

export const ByID = authed
	.input(ContactRemoveRequestSchema)
	.output(ContactResponseSchema)
	.handler(({ input }) => ContactsAPI.remove.ByID(input));
