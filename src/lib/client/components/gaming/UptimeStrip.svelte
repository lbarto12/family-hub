<script lang="ts">
	import { formatPercent, type StripBucket } from './series';

	interface Props {
		buckets: StripBucket[];
		formatTime: (date: Date) => string;
		height?: number;
	}

	let { buckets, formatTime, height = 44 }: Props = $props();

	let hovered: number | null = $state(null);

	// Status, not category: four reserved states, each also named in the legend
	const stateOf = (uptime: number | null): { fill: string; label: string } => {
		if (uptime === null) return { fill: 'fill-base-300', label: 'no data' };
		if (uptime >= 0.999) return { fill: 'fill-success', label: 'up' };
		if (uptime <= 0) return { fill: 'fill-error', label: 'down' };
		return { fill: 'fill-warning', label: 'partial' };
	};

	// At 288 buckets a 2px spacer is wider than the segment it separates, turning
	// the bar into a hatch pattern — drop the spacers once they stop helping
	const dense: boolean = $derived(buckets.length > 120);

	const active: StripBucket | null = $derived(hovered === null ? null : (buckets[hovered] ?? null));
</script>

<figure class="flex flex-col gap-2">
	<figcaption class="flex items-baseline justify-between">
		<h3 class="text-sm font-medium">Uptime</h3>
		{#if active}
			<span class="text-sm text-base-content/70 tabular-nums">
				{formatTime(active.start)} · {active.uptime === null
					? 'no data'
					: formatPercent(active.uptime)}
			</span>
		{/if}
	</figcaption>

	<!-- One flex cell per bucket, so segments stay even at any width and the 2px
	     gap between them comes from the layout rather than from geometry maths -->
	<div
		class="flex w-full {dense ? 'gap-0' : 'gap-[2px]'}"
		style="height: {height}px"
		role="group"
		aria-label="Uptime by time bucket"
		onpointerleave={() => (hovered = null)}
	>
		{#each buckets as bucket, index (bucket.start.getTime())}
			{@const status = stateOf(bucket.uptime)}

			<button
				type="button"
				class="min-w-0 flex-1 cursor-default p-0 transition-opacity {dense
					? ''
					: 'rounded-[2px]'} {hovered !== null && hovered !== index ? 'opacity-60' : ''}"
				aria-label="{formatTime(bucket.start)}: {status.label}"
				title="{formatTime(bucket.start)} — {status.label}"
				onpointerenter={() => (hovered = index)}
				onfocus={() => (hovered = index)}
				onblur={() => (hovered = null)}
			>
				<svg class="h-full w-full" preserveAspectRatio="none" viewBox="0 0 1 1" aria-hidden="true">
					<rect width="1" height="1" class={status.fill} />
				</svg>
			</button>
		{/each}
	</div>

	<!-- Identity never rests on colour alone -->
	<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/60">
		<span class="flex items-center gap-1.5"
			><span class="size-2 rounded-[2px] bg-success"></span>Up</span
		>
		<span class="flex items-center gap-1.5"
			><span class="size-2 rounded-[2px] bg-warning"></span>Partial</span
		>
		<span class="flex items-center gap-1.5"
			><span class="size-2 rounded-[2px] bg-error"></span>Down</span
		>
		<span class="flex items-center gap-1.5"
			><span class="size-2 rounded-[2px] bg-base-300"></span>No data</span
		>
	</div>
</figure>
