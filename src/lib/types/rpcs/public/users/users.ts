import z from 'zod';

export const UserCreateRequestSchema = z.object({
    email: z.email('invalid email'),
    password: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string()
});

export const UserUpdateRequestSchema = z.object({
    userID: z.uuid(),
    email: z.email('invalid email'),
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string()
});

export const UserResponseSchema = z.object({
    email: z.email('invalid email'),
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string()
});

export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>;
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
