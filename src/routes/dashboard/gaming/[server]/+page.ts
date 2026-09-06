import { isGameServerSlug, type GameServerSlug } from '$lib/types/rpcs/private/gaming/servers';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }): { slug: GameServerSlug } => {
	if (!isGameServerSlug(params.server)) error(404, 'unknown game server');
	return { slug: params.server };
};
