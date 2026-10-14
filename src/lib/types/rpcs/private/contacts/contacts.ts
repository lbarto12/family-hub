import z from 'zod';

export const ContactFieldsSchema = z.object({
	firstName: z.string().trim().min(1, 'a first name is required'),
	lastName: z.string().trim(),
	organization: z.string().trim(),
	email: z.email('invalid email').or(z.literal('')),
	phoneNumber: z.string().trim(),
	street: z.string().trim(),
	city: z.string().trim(),
	region: z.string().trim(),
	postalCode: z.string().trim(),
	country: z.string().trim(),
	notes: z.string().trim()
});

export const ContactCreateRequestSchema = ContactFieldsSchema;

export const ContactUpdateRequestSchema = ContactFieldsSchema.extend({
	id: z.uuid()
});

export const ContactRemoveRequestSchema = z.object({
	id: z.uuid()
});

export const ContactResponseSchema = ContactFieldsSchema.extend({
	id: z.uuid()
});

export const ContactListResponseSchema = z.object({
	contacts: z.array(ContactResponseSchema)
});

export type ContactFields = z.infer<typeof ContactFieldsSchema>;
export type ContactCreateRequest = z.infer<typeof ContactCreateRequestSchema>;
export type ContactUpdateRequest = z.infer<typeof ContactUpdateRequestSchema>;
export type ContactRemoveRequest = z.infer<typeof ContactRemoveRequestSchema>;
export type ContactResponse = z.infer<typeof ContactResponseSchema>;
export type ContactListResponse = z.infer<typeof ContactListResponseSchema>;
