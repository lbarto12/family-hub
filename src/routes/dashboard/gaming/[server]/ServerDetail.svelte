<script lang="ts">
	import { resolve } from '$app/paths';
	import GameIcon from '$lib/client/components/gaming/GameIcon.svelte';
	import TimeSeries from '$lib/client/components/gaming/TimeSeries.svelte';
	import UptimeStrip from '$lib/client/components/gaming/UptimeStrip.svelte';
	import {
		formatBytes,
		formatCores,
		formatDuration,
		formatPercent,
		niceMaxBytes
	} from '$lib/client/components/gaming/series';
	import { HISTORY_RANGES, type HistoryRange } from '$lib/types/rpcs/private/gaming/servers';
	import { untrack } from 'svelte';
	import { NewServerPage, type Fields } from './page.module.svelte';
	import type { GameServerSlug } from '$lib/types/rpcs/private/gaming/servers';

	interface Props {
		slug: GameServerSlug;
	}

	// Keyed on slug by +page.svelte, so this state is rebuilt rather than reused
	// when one server's page navigates straight to another's
	let { slug }: Props = $props();

	// untrack states the intent the {#key} already enforces: take the slug once,
	// and let the parent rebuild this component if it ever changes
	const state: Fields = NewServerPage(untrack((): GameServerSlug => slug));

	$effect(state.start);

	const RANGE_LABELS: Record<HistoryRange, string> = {
		hour: '1h',
		day: '24h',
		week: '7d',
		month: '30d'
	};
</script>

<div class="flex flex-col gap-6 px-6 py-8">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<!-- The inner group needs its own wrap: without it the back link, title and
		     badge hold a fixed width open and scroll the whole page sideways -->
		<div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
			<a class="btn btn-ghost btn-sm" href={resolve('/dashboard/gaming')}>← Servers</a>

			<div class="flex min-w-0 items-center gap-3">
				<GameIcon slug={state.slug} class="size-9 shrink-0 text-base-content/80" />
				<h1 class="truncate text-2xl font-semibold">{state.label}</h1>
			</div>

			{#if state.status}
				<span
					class="badge gap-2 {state.status.running
						? 'badge-success'
						: state.status.reachable
							? 'badge-error'
							: 'badge-ghost'}"
				>
					<span class="size-2 rounded-full bg-current"></span>
					{state.status.reachable ? state.status.state : 'unreachable'}
				</span>
			{/if}
		</div>

		<!-- Filters sit in one row above the charts. A joined button group cannot
		     wrap, so when the panel is open on a narrow screen this row scrolls
		     inside itself rather than dragging the whole page sideways -->
		<div class="max-w-full overflow-x-auto">
			<div class="join">
				{#each HISTORY_RANGES as range (range)}
					<button
						type="button"
						class="btn join-item btn-sm {state.range === range ? 'btn-active' : ''}"
						aria-pressed={state.range === range}
						onclick={() => {
							state.setRange(range);
						}}
					>
						{RANGE_LABELS[range]}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
		<div class="rounded-box border border-base-300 bg-base-100 p-4">
			<div class="text-xs text-base-content/60">Uptime ({RANGE_LABELS[state.range]})</div>
			<div class="text-2xl font-semibold tabular-nums">
				{state.history ? formatPercent(state.history.uptime) : '—'}
			</div>
		</div>

		<div class="rounded-box border border-base-300 bg-base-100 p-4">
			<div class="text-xs text-base-content/60">Restarts</div>
			<div class="text-2xl font-semibold tabular-nums">
				{state.history ? state.history.restarts : '—'}
			</div>
		</div>

		<div class="rounded-box border border-base-300 bg-base-100 p-4">
			<div class="text-xs text-base-content/60">Memory now</div>
			<div class="text-2xl font-semibold tabular-nums">
				{formatBytes(state.status?.memoryBytes ?? null)}
			</div>
		</div>

		<div class="rounded-box border border-base-300 bg-base-100 p-4">
			<div class="text-xs text-base-content/60">Up for</div>
			<div class="text-2xl font-semibold tabular-nums">
				{formatDuration(state.status?.activeForSeconds ?? null)}
			</div>
		</div>
	</div>

	{#if state.loading && !state.history}
		<span class="loading loading-spinner"></span>
	{:else if state.history?.samples === 0}
		<div class="rounded-box border border-base-300 bg-base-100 p-8 text-center">
			<p class="text-base-content/70">
				No samples recorded in this window yet — the poller writes one every few seconds.
			</p>
		</div>
	{:else}
		<div class="flex flex-col gap-6 rounded-box border border-base-300 bg-base-100 p-5">
			<UptimeStrip buckets={state.strip} formatTime={state.formatTime} />
		</div>

		<!-- Two measures, two scales, two charts: never a second y-axis -->
		<div class="grid gap-4 lg:grid-cols-2">
			<div class="rounded-box border border-base-300 bg-base-100 p-5">
				<TimeSeries
					title="Memory"
					points={state.memory}
					format={formatBytes}
					formatTime={state.formatTime}
					ceiling={niceMaxBytes}
					accent="text-primary"
				/>
			</div>

			<div class="rounded-box border border-base-300 bg-base-100 p-5">
				<TimeSeries
					title="CPU"
					points={state.cpu}
					format={formatCores}
					formatTime={state.formatTime}
					accent="text-primary"
				/>
			</div>
		</div>
	{/if}
</div>
