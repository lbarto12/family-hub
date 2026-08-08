import { router } from '$lib/server/rpc/public/router';
import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { CORSPlugin } from '@orpc/server/plugins';
import { type RequestHandler } from '@sveltejs/kit';

const handler = new RPCHandler(router, {
	interceptors: [
		onError((error) => {
			console.log(error);
		})
	],
	plugins: [
		new CORSPlugin({
			origin: (origin) => origin,
			allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH']
		})
	]
});

const handle: RequestHandler = async (event) => {
	const { response } = await handler.handle(event.request, {
		prefix: '/rpc/public',
		context: {
			event
		}
	});

	return response ?? new Response('Not Found', { status: 404 });
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
