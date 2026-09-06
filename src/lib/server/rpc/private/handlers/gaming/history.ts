import { GamingAPI } from '$lib/server/domains/gaming';
import { authed } from '$lib/server/rpc/private/orpc';
import {
	HistoryRequestSchema,
	HistoryResponseSchema
} from '$lib/types/rpcs/private/gaming/servers';

export const ForService = authed
	.input(HistoryRequestSchema)
	.output(HistoryResponseSchema)
	.handler(({ input }) => GamingAPI.history.ForService(input.slug, input.range));
