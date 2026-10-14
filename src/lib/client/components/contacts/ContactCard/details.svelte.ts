import { AddressLines, DisplayName, Initials, TelHref } from '../format';
import type { Details, Props } from './models';

export const createDetails = (props: Props): Details => {
	const name: string = $derived(DisplayName(props.contact));
	const initials: string = $derived(Initials(props.contact));
	const address: string[] = $derived(AddressLines(props.contact));
	const callHref: string | null = $derived(
		props.contact.phoneNumber ? TelHref(props.contact.phoneNumber) : null
	);

	return {
		get name(): string {
			return name;
		},
		get initials(): string {
			return initials;
		},
		get address(): string[] {
			return address;
		},
		get callHref(): string | null {
			return callHref;
		}
	};
};
