import z from 'zod';

export const PingResponseSchema = z.object({
	response: z.string()
});
export type PingResponse = z.infer<typeof PingResponseSchema>;
