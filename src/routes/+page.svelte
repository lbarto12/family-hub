<script lang="ts">
	import { resolve } from '$app/paths';
	import { GAME_SERVERS } from '$lib/types/rpcs/private/gaming/servers';

	// Named here rather than derived from the router: this page is public, and the
	// sections it advertises are the ones a signed-in member lands on
	const sections: { title: string; blurb: string }[] = [
		{
			title: 'Game servers',
			blurb: `Live status and uptime history for ${String(GAME_SERVERS.length)} servers.`
		},
		{
			title: 'Dashboard',
			blurb: 'Personal storage, family passwords, and information, in one place.'
		}
	];
</script>

<svelte:head><title>Family Hub</title></svelte:head>

<!-- dvh, not vh: on mobile 100vh is taller than the visible area and leaves the
     page scrollable by the height of the browser toolbar -->
<div class="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-base-200 px-6 py-16">
	<!-- Soft backdrop, drawn from theme tokens so it follows light and dark. No
	     negative z-index: that would paint it behind the parent's own background -->
	<div
		class="pointer-events-none absolute inset-0 opacity-25"
		style="background:
			radial-gradient(60rem 40rem at 15% -10%, var(--color-primary) 0%, transparent 55%),
			radial-gradient(50rem 35rem at 110% 20%, var(--color-secondary) 0%, transparent 55%)"
		aria-hidden="true"
	></div>

	<main class="relative flex w-full max-w-xl flex-col items-center gap-8 text-center">
		<div
			class="flex size-16 items-center justify-center rounded-box bg-base-100 shadow-sm ring-1 ring-base-300"
		>
			<svg
				class="size-8 text-primary"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.75"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M3 10.5 12 3l9 7.5" />
				<path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" />
				<path d="M9.5 21v-5a2.5 2.5 0 0 1 5 0v5" />
			</svg>
		</div>

		<div class="flex flex-col gap-3">
			<h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">Family Hub</h1>
			<p class="text-lg text-base-content/70">Our household's own corner of the internet.</p>
		</div>

		<a class="btn btn-lg btn-primary" href={resolve('/session')}>Sign in</a>

		<ul class="mt-4 grid w-full gap-3 text-left sm:grid-cols-2">
			{#each sections as section (section.title)}
				<li class="rounded-box border border-base-300 bg-base-100/80 p-4">
					<h2 class="font-medium">{section.title}</h2>
					<p class="mt-1 text-sm text-base-content/60">{section.blurb}</p>
				</li>
			{/each}
		</ul>
	</main>
</div>
