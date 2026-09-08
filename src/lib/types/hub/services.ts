/**
 * What a signed-in family member can reach from the dashboard.
 *
 * Internal destinations carry a route id so `resolve()` can type-check them;
 * external ones carry a full URL, because they are separate services this app
 * only links to.
 */
export type ServiceIcon = 'gaming' | 'passwords' | 'profile';

export type ServiceDestination =
	| {
			readonly kind: 'route';
			readonly route: '/dashboard/gaming' | '/dashboard/passwords' | '/profile';
	  }
	| { readonly kind: 'external'; readonly url: string };

export interface Service {
	readonly title: string;
	readonly blurb: string;
	readonly icon: ServiceIcon;
	/** Tailwind classes for the icon tile, so each card reads as its own thing */
	readonly accent: string;
	readonly destination: ServiceDestination;
}

/**
 * The vault lives on its own port behind tailscale funnel, so this has to match
 * whatever `tailscale funnel` is pointed at — and vaultwarden's own DOMAIN.
 * Change all three together or invite links and 2FA break.
 */
export const VAULT_URL = 'https://primary.tail84c71b.ts.net:8443';

export const SERVICES: readonly Service[] = [
	{
		title: 'Game servers',
		blurb: 'Live status and uptime for the family game servers.',
		icon: 'gaming',
		accent: 'bg-primary/10 text-primary',
		destination: { kind: 'route', route: '/dashboard/gaming' }
	},
	{
		title: 'Passwords',
		blurb: 'Shared logins for the household, and how to get set up.',
		icon: 'passwords',
		accent: 'bg-secondary/10 text-secondary',
		destination: { kind: 'route', route: '/dashboard/passwords' }
	},
	{
		title: 'Your profile',
		blurb: 'Your details and account settings.',
		icon: 'profile',
		accent: 'bg-accent/10 text-accent',
		destination: { kind: 'route', route: '/profile' }
	}
];
