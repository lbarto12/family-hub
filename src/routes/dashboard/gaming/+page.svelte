<script lang="ts">
	import { resolve } from '$app/paths';
	import GameIcon from '$lib/client/components/gaming/GameIcon.svelte';
	import { GAME_SERVERS } from '$lib/types/rpcs/private/gaming/servers';
	import { NewGamingPage, type Fields } from './page.module.svelte';

	const state: Fields = NewGamingPage();

	$effect(state.start);

	const statusOf = (slug: string): { running: boolean; label: string } => {
		const server = state.servers.find((s): boolean => s.slug === slug);
		if (!server) return { running: false, label: 'checking' };
		if (!server.reachable) return { running: false, label: 'unreachable' };
		return { running: server.running, label: server.running ? 'running' : server.state };
	};
</script>

<div class="flex flex-col gap-6 px-6 py-8">
	<section class="flex flex-col gap-4">
		<div class="flex items-baseline justify-between">
			<h1 class="text-2xl font-semibold">Game servers</h1>
			{#if !state.loading && !state.polling}
				<span class="text-sm text-warning">poller offline</span>
			{/if}
		</div>

		<!-- Square badges: the game's mark, and a dot for whether it is live -->
		<ul class="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-4">
			{#each GAME_SERVERS as server (server.slug)}
				{@const status = statusOf(server.slug)}

				<li>
					<a
						class="group relative flex aspect-square items-center justify-center rounded-box border border-base-300 bg-base-100 shadow-sm transition-shadow hover:shadow-md"
						href={resolve('/dashboard/gaming/[server]', { server: server.slug })}
						aria-label="{server.label} — {status.label}"
						title="{server.label} — {status.label}"
					>
						<GameIcon slug={server.slug} class="size-14 text-base-content/80" />

						<span
							class="absolute top-3 right-3 size-2.5 rounded-full {status.running
								? 'bg-success'
								: 'bg-base-300'}"
						></span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>
