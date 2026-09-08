<script lang="ts">
	import { resolve } from '$app/paths';
	import { SERVICES, type Service } from '$lib/types/hub/services';
	import { NewDashboardPage, type Fields } from './page.module.svelte';

	const state: Fields = NewDashboardPage();

	const isExternal = (service: Service): boolean => service.destination.kind === 'external';

	const hrefFor = (service: Service): string =>
		service.destination.kind === 'external'
			? service.destination.url
			: resolve(service.destination.route);

	// Only the gaming card has a live figure behind it; the rest are static
	const statusFor = (service: Service): string | null => {
		if (service.icon !== 'gaming') return null;
		if (state.serversOnline === null || state.serversTotal === null) return null;
		return `${String(state.serversOnline)} of ${String(state.serversTotal)} online`;
	};
</script>

<div class="flex flex-col gap-6 px-6 py-8">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold">Dashboard</h1>
		<p class="text-base-content/60">Everything the household shares, in one place.</p>
	</div>

	<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each SERVICES as service (service.title)}
			{@const status = statusFor(service)}
			{@const external = isExternal(service)}

			<li>
				<!-- The vault is a separate service on its own origin, so this href
				     cannot go through resolve(); the rule cannot see that statically
				     because the destination is chosen per card -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					class="flex h-full items-start gap-4 rounded-box border border-base-300 bg-base-100 p-5 transition-shadow hover:shadow-md"
					href={hrefFor(service)}
					target={external ? '_blank' : undefined}
					rel={external ? 'noopener noreferrer' : undefined}
				>
					<span
						class="flex size-11 shrink-0 items-center justify-center rounded-box {service.accent}"
					>
						<svg
							class="size-6"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							{#if service.icon === 'gaming'}
								<path
									d="M7 8h10a4 4 0 0 1 4 4v1a3 3 0 0 1-5.1 2.1l-.9-.9H9l-.9.9A3 3 0 0 1 3 13v-1a4 4 0 0 1 4-4Z"
								/>
								<path d="M7 11.5h3M8.5 10v3M15.5 11.5h.01M17.5 13.5h.01" />
							{:else if service.icon === 'passwords'}
								<path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 8.5-4.1-.9-7-4.3-7-8.5V6l7-3Z" />
								<circle cx="12" cy="10.5" r="1.9" />
								<path d="M12 12.4v3.1" />
							{:else if service.icon === 'profile'}
								<circle cx="12" cy="8.5" r="3.5" />
								<path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
							{/if}
						</svg>
					</span>

					<span class="flex min-w-0 flex-col gap-1">
						<span class="flex items-center gap-2 font-medium">
							{service.title}
							{#if external}
								<svg
									class="size-3.5 shrink-0 text-base-content/40"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path
										d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
									/>
								</svg>
							{/if}
						</span>

						<span class="text-sm text-base-content/60">{service.blurb}</span>

						{#if status}
							<span class="mt-1 text-xs text-base-content/50 tabular-nums">{status}</span>
						{/if}
					</span>
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</li>
		{/each}
	</ul>
</div>
