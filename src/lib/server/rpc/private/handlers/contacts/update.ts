import { ContactsAPI } from '$lib/server/domains/contacts';
import { authed } from '$lib/server/rpc/private/orpc';
import {
	ContactResponseSchema,
	ContactUpdateRequestSchema
} from '$lib/types/rpcs/private/contacts/contacts';

export const ByID = authed
	.input(ContactUpdateRequestSchema)
	.output(ContactResponseSchema)
	.handler(({ input }) => ContactsAPI.update.ByID(input));
