import { ContactsAPI } from '$lib/server/domains/contacts';
import { authed } from '$lib/server/rpc/private/orpc';
import { ContactListResponseSchema } from '$lib/types/rpcs/private/contacts/contacts';

export const All = authed.output(ContactListResponseSchema).handler(() => ContactsAPI.list.All());
