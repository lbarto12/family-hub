import { o } from '$lib/server/rpc/public/orpc';
import { HealthCheckResponseSchema } from '$lib/types/rpcs/public/health/ping';

export const Get = o.output(HealthCheckResponseSchema).handler(() => {
	return {
		check: 'ok'
	};
});
