<script lang="ts">
	import { useContactCardState } from './component.svelte';
	import type { ContactCard, Props } from './models';

	const props: Props = $props();
	// The hook only reads props inside getters and $derived, so it stays reactive
	// svelte-ignore state_referenced_locally
	const card: ContactCard = useContactCardState(props);
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-start gap-4">
		<span
			class="flex size-14 shrink-0 items-center justify-center rounded-full bg-info/10 text-lg font-semibold text-info"
			aria-hidden="true"
		>
			{card.details.initials}
		</span>

		<div class="flex min-w-0 flex-1 flex-col">
			<h2 class="truncate text-xl font-semibold">{card.details.name}</h2>
			{#if card.contact.organization}
				<span class="truncate text-sm text-base-content/60">{card.contact.organization}</span>
			{/if}
		</div>

		<button
			type="button"
			class="btn btn-circle btn-ghost btn-sm"
			aria-label="Close"
			onclick={card.close}
		>
			<svg
				class="size-4"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				aria-hidden="true"
			>
				<path d="M6 6l12 12M18 6L6 18" />
			</svg>
		</button>
	</div>

	<div class="grid grid-cols-3 gap-2">
		{#if card.details.callHref}
			<!-- tel: is a scheme, not a route, so there is nothing for resolve() to do -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a class="btn h-auto flex-col gap-1 py-2 btn-primary" href={card.details.callHref}>
				<svg
					class="size-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.75"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path
						d="M5 4h3l1.5 4.5-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2L20 16v3a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"
					/>
				</svg>
				Call
			</a>
		{:else}
			<button type="button" class="btn h-auto flex-col gap-1 py-2" disabled title="No phone number">
				<svg
					class="size-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.75"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path
						d="M5 4h3l1.5 4.5-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2L20 16v3a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"
					/>
				</svg>
				Call
			</button>
		{/if}

		<button type="button" class="btn h-auto flex-col gap-1 py-2" onclick={card.download}>
			<svg
				class="size-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.75"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<circle cx="10" cy="8.5" r="3.5" />
				<path d="M3.5 19.5a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" />
			</svg>
			Add Contact
		</button>

		<button
			type="button"
			class="btn h-auto flex-col gap-1 py-2 {card.showQR ? 'btn-active' : ''}"
			aria-pressed={card.showQR}
			onclick={card.toggleQR}
		>
			<svg
				class="size-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.75"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18v2M18 18h2v2" />
			</svg>
			QR Code
		</button>
	</div>

	{#if card.showQR}
		<div class="flex flex-col items-center gap-2">
			{#if card.qr.error}
				<p class="text-sm text-error">{card.qr.error}</p>
			{:else}
				<!-- Always dark on white: scanners expect it, whatever the theme -->
				<div class="rounded-box bg-white p-3">
					<svg
						class="size-60"
						viewBox="0 0 {card.qr.size} {card.qr.size}"
						shape-rendering="crispEdges"
						role="img"
						aria-label="QR code for {card.details.name}"
					>
						<path d={card.qr.path} fill="#000" />
					</svg>
				</div>
				<p class="text-sm text-base-content/60">Point your phone's camera here to save.</p>
			{/if}
		</div>
	{/if}

	<dl class="flex flex-col gap-4">
		{#if card.details.callHref}
			<div>
				<dt class="label text-xs">Phone</dt>
				<dd>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a class="link link-hover" href={card.details.callHref}>{card.contact.phoneNumber}</a>
				</dd>
			</div>
		{/if}

		{#if card.contact.email}
			<div>
				<dt class="label text-xs">Email</dt>
				<dd>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a class="link break-all link-hover" href="mailto:{card.contact.email}"
						>{card.contact.email}</a
					>
				</dd>
			</div>
		{/if}

		{#if card.details.address.length > 0}
			<div>
				<dt class="label text-xs">Address</dt>
				{#each card.details.address as line, i (i)}
					<dd>{line}</dd>
				{/each}
			</div>
		{/if}

		{#if card.contact.notes}
			<div>
				<dt class="label text-xs">Notes</dt>
				<dd class="whitespace-pre-line">{card.contact.notes}</dd>
			</div>
		{/if}
	</dl>

	<div class="flex justify-end">
		<button type="button" class="btn btn-ghost" onclick={card.edit}>Edit</button>
	</div>
</div>
