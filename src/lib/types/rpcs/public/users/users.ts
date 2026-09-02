import z from 'zod';

export const UserCreateRequestSchema = z.object({
	email: z.email('invalid email'),
	password: z.string()
});

export const UserResponseSchema = z.object({
	email: z.email('invalid email')
});

export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
