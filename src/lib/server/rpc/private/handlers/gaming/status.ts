import { GamingAPI } from '$lib/server/domains/gaming';
import { authed } from '$lib/server/rpc/private/orpc';
import { ServerStatusListSchema } from '$lib/types/rpcs/private/gaming/servers';

export const All = authed.output(ServerStatusListSchema).handler(() => GamingAPI.status.All());
