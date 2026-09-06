<script lang="ts">
	import { niceMax, type SeriesPoint } from './series';

	interface Props {
		title: string;
		points: SeriesPoint[];
		format: (value: number | null) => string;
		formatTime: (date: Date) => string;
		/** Tailwind text colour class; the marks inherit it through currentColor */
		accent?: string;
		/** Override how the axis ceiling is rounded, e.g. binary steps for bytes */
		ceiling?: (value: number) => number;
		height?: number;
	}

	let {
		title,
		points,
		format,
		formatTime,
		accent = 'text-primary',
		ceiling = niceMax,
		height = 180
	}: Props = $props();

	const PAD = { top: 12, right: 12, bottom: 24, left: 60 };

	let width: number = $state(0);
	let hovered: number | null = $state(null);

	const plotWidth: number = $derived(Math.max(0, width - PAD.left - PAD.right));
	const plotHeight: number = $derived(Math.max(0, height - PAD.top - PAD.bottom));

	const max: number = $derived(ceiling(Math.max(0, ...points.map((p): number => p.value ?? 0))));

	// A single bucket has no span to spread across, so it sits at the left edge
	const x = (index: number): number =>
		PAD.left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * plotWidth);

	const y = (value: number): number => PAD.top + plotHeight - (value / max) * plotHeight;

	/** Split on gaps so a missing bucket breaks the line instead of bridging it */
	const segments: { index: number; value: number }[][] = $derived.by(() => {
		const out: { index: number; value: number }[][] = [];
		let current: { index: number; value: number }[] = [];

		points.forEach((point, index): undefined => {
			if (point.value === null) {
				if (current.length > 0) out.push(current);
				current = [];
				return;
			}
			current.push({ index, value: point.value });
		});

		if (current.length > 0) out.push(current);
		return out;
	});

	const line = (segment: { index: number; value: number }[]): string =>
		segment
			.map(
				(p, i): string => `${i === 0 ? 'M' : 'L'}${x(p.index).toFixed(2)} ${y(p.value).toFixed(2)}`
			)
			.join(' ');

	const area = (segment: { index: number; value: number }[]): string => {
		const first = segment.at(0);
		const last = segment.at(-1);
		if (!first || !last) return '';

		const base = (PAD.top + plotHeight).toFixed(2);
		return `${line(segment)} L${x(last.index).toFixed(2)} ${base} L${x(first.index).toFixed(2)} ${base} Z`;
	};

	const ticks: number[] = $derived([0, 0.5, 1].map((t): number => t * max));

	// Four evenly spaced labels, or fewer when there are fewer buckets
	const timeTicks: number[] = $derived.by(() => {
		if (points.length === 0) return [];
		const count = Math.min(4, points.length);
		return Array.from({ length: count }, (_, i): number =>
			Math.round((i / Math.max(1, count - 1)) * (points.length - 1))
		);
	});

	const move = (event: PointerEvent): undefined => {
		if (points.length === 0 || plotWidth <= 0) return;

		const bounds =
			event.currentTarget instanceof Element ? event.currentTarget.getBoundingClientRect() : null;
		if (!bounds) return;

		const ratio = (event.clientX - bounds.left - PAD.left) / plotWidth;
		hovered = Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1))));
	};

	const leave = (): undefined => {
		hovered = null;
	};

	const active: SeriesPoint | null = $derived(hovered === null ? null : (points[hovered] ?? null));
</script>

<figure class="flex flex-col gap-1">
	<figcaption class="flex items-baseline justify-between">
		<h3 class="text-sm font-medium">{title}</h3>
		{#if active}
			<span class="text-sm text-base-content/70 tabular-nums">
				{formatTime(active.start)} · {format(active.value)}
			</span>
		{/if}
	</figcaption>

	<div class="relative w-full {accent}" bind:clientWidth={width}>
		{#if width > 0}
			<svg
				{width}
				{height}
				role="img"
				aria-label={title}
				onpointermove={move}
				onpointerleave={leave}
			>
				<!-- Recessive grid: present enough to read a value against, quiet enough to ignore -->
				{#each ticks as tick (tick)}
					<line
						x1={PAD.left}
						x2={PAD.left + plotWidth}
						y1={y(tick)}
						y2={y(tick)}
						class="stroke-base-content/10"
						stroke-width="1"
					/>
					<text
						x={PAD.left - 8}
						y={y(tick)}
						text-anchor="end"
						dominant-baseline="middle"
						class="fill-base-content/50 text-[10px] tabular-nums"
					>
						{format(tick)}
					</text>
				{/each}

				{#each timeTicks as index (index)}
					<text
						x={x(index)}
						y={height - 6}
						text-anchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
						class="fill-base-content/50 text-[10px] tabular-nums"
					>
						{formatTime(points[index].start)}
					</text>
				{/each}

				{#each segments as segment, i (i)}
					{#if segment.length === 1}
						<!-- A lone sample between two gaps has no line to draw, so mark the point -->
						<circle cx={x(segment[0].index)} cy={y(segment[0].value)} r="2.5" fill="currentColor" />
					{:else}
						<path d={area(segment)} fill="currentColor" opacity="0.12" />
						<path
							d={line(segment)}
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linejoin="round"
							stroke-linecap="round"
						/>
					{/if}
				{/each}

				{#if hovered !== null && active?.value !== null && active !== null}
					<line
						x1={x(hovered)}
						x2={x(hovered)}
						y1={PAD.top}
						y2={PAD.top + plotHeight}
						class="stroke-base-content/30"
						stroke-width="1"
					/>
					<!-- 2px surface ring so the marker stays legible over the fill -->
					<circle
						cx={x(hovered)}
						cy={y(active.value)}
						r="4.5"
						fill="currentColor"
						class="stroke-base-100"
						stroke-width="2"
					/>
				{/if}
			</svg>
		{/if}
	</div>
</figure>
