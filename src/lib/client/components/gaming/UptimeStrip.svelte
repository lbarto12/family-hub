<script lang="ts">
	import { formatPercent, type StripBucket } from './series';

	interface Props {
		buckets: StripBucket[];
		formatTime: (date: Date) => string;
		height?: number;
	}

	let { buckets, formatTime, height = 44 }: Props = $props();

	let width: number = $state(0);
	let hovered: number | null = $state(null);

	// At 288 buckets a 2px spacer is wider than the segment it separates, turning
	// the bar into a hatch pattern — drop the spacers once they stop helping
	const dense: boolean = $derived(buckets.length > 120);
	const gap: number = $derived(dense ? 0 : 2);
	const radius: number = $derived(dense ? 0 : 2);

	// Status, not category: four reserved states, each also named in the legend
	const stateOf = (uptime: number | null): { fill: string; label: string } => {
		if (uptime === null) return { fill: 'fill-base-300', label: 'no data' };
		if (uptime >= 0.999) return { fill: 'fill-success', label: 'up' };
		if (uptime <= 0) return { fill: 'fill-error', label: 'down' };
		return { fill: 'fill-warning', label: 'partial' };
	};

	/**
	 * Snapped to whole pixels. Laying this out as one flex box per bucket leaves
	 * every edge on a fraction of a pixel, and the antialiasing seams between 289
	 * of them read as a hatch even with no gap between them at all.
	 */
	const segments: { bucket: StripBucket; x: number; w: number }[] = $derived.by(() => {
		const count = buckets.length;
		if (count === 0 || width <= 0) return [];

		return buckets.map((bucket, index): { bucket: StripBucket; x: number; w: number } => {
			const from = Math.round((index * width) / count);
			const to = Math.round(((index + 1) * width) / count);
			return { bucket, x: from, w: Math.max(1, to - from - gap) };
		});
	});

	const move = (event: PointerEvent): undefined => {
		const bounds =
			event.currentTarget instanceof Element ? event.currentTarget.getBoundingClientRect() : null;
		if (!bounds || buckets.length === 0 || bounds.width <= 0) return;

		const ratio = (event.clientX - bounds.left) / bounds.width;
		hovered = Math.min(buckets.length - 1, Math.max(0, Math.floor(ratio * buckets.length)));
	};

	const leave = (): undefined => {
		hovered = null;
	};

	const active: StripBucket | null = $derived(hovered === null ? null : (buckets[hovered] ?? null));

	const summary: string = $derived.by(() => {
		const known = buckets.filter((b): boolean => b.uptime !== null);
		if (known.length === 0) return 'Uptime by time bucket: no data recorded';

		const mean = known.reduce((sum, b): number => sum + (b.uptime ?? 0), 0) / known.length;
		return `Uptime by time bucket: ${formatPercent(mean)} across ${String(known.length)} buckets`;
	});
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

	<!-- Absolutely positioned, so the measured svg can never widen the box it is
	     measured from and ratchet the page into a horizontal scroll -->
	<div
		class="relative w-full"
		style="height: {height}px"
		bind:clientWidth={width}
		onpointermove={move}
		onpointerleave={leave}
		role="img"
		aria-label={summary}
	>
		{#if width > 0}
			<svg class="absolute inset-0" {width} {height} aria-hidden="true">
				{#each segments as segment, index (segment.bucket.start.getTime())}
					{@const status = stateOf(segment.bucket.uptime)}

					<rect
						x={segment.x}
						y="0"
						width={segment.w}
						{height}
						rx={radius}
						class="{status.fill} {hovered !== null && hovered !== index ? 'opacity-60' : ''}"
					>
						<title>{formatTime(segment.bucket.start)} — {status.label}</title>
					</rect>
				{/each}
			</svg>
		{/if}
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
