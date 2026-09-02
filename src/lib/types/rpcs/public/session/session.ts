import z from 'zod';

export const SessionLoginRequestSchema = z.object({
	email: z.email('invalid email'),
	password: z.string()
});

export const SessionBundleSchema = z.object({
	refresh: z.string(),
	access: z.string()
});

export type SessionLoginRequest = z.infer<typeof SessionLoginRequestSchema>;
export type SessionBundle = z.infer<typeof SessionBundleSchema>;
