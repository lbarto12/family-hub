import type { ContactFields, ContactResponse } from '$lib/types/rpcs/private/contacts/contacts';

export interface Props {
	/** null to enter a new contact */
	contact: ContactResponse | null;
	onsaved: (contact: ContactResponse) => undefined;
	ondeleted: (id: string) => undefined;
	oncancel: () => undefined;
}

export type InputKey = Exclude<keyof ContactFields, 'notes'>;

export interface FieldDefinition {
	readonly key: InputKey;
	readonly label: string;
	readonly type: 'text' | 'email' | 'tel';
	/** Spans both columns on wider screens */
	readonly wide: boolean;
}

export interface FieldSection {
	readonly title: string;
	readonly fields: readonly FieldDefinition[];
}

export interface FormState {
	fields: ContactFields;
	saving: boolean;
	error: string | null;
}

export interface Actions {
	submit: (event: SubmitEvent) => Promise<undefined>;
	remove: () => Promise<undefined>;
	cancel: () => undefined;
}

export interface ContactForm {
	readonly sections: readonly FieldSection[];
	readonly fields: ContactFields;
	readonly isNew: boolean;
	readonly saving: boolean;
	readonly error: string | null;
	submit: (event: SubmitEvent) => Promise<undefined>;
	remove: () => Promise<undefined>;
	cancel: () => undefined;
}
