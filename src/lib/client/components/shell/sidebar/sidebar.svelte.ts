import type { RouteId, RouteParams } from '$app/types';

export type IconName = 'dashboard' | 'gaming' | 'passwords';

// Routes that take no params, so a nav entry is always resolvable on its own
export type NavRoute = {
	[K in RouteId]: RouteParams<K> extends Record<string, never> ? K : never;
}[RouteId];

export interface NavLink {
	readonly route: NavRoute;
	readonly label: string;
	readonly icon: IconName;
}

export const links: readonly NavLink[] = [
	{ route: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
	{ route: '/dashboard/gaming', label: 'Gaming', icon: 'gaming' },
	{ route: '/dashboard/passwords', label: 'Passwords', icon: 'passwords' }
];

export interface Fields {
	readonly open: boolean;
	toggle: () => undefined;
}

// The panel is a preference rather than page state, so it survives navigation
// and reloads instead of snapping shut under the user
const STORAGE_KEY = 'sidebar-open';

export const NewSidebar = (): Fields => {
	let open: boolean = $state(localStorage.getItem(STORAGE_KEY) === 'true');

	const toggle = (): undefined => {
		open = !open;
		localStorage.setItem(STORAGE_KEY, String(open));
	};

	return {
		get open() {
			return open;
		},
		toggle
	};
};
