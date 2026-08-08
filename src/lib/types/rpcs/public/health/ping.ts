import z from 'zod';

export const HealthCheckResponseSchema = z.object({
	check: z.string()
});
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
