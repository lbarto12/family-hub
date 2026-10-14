<script lang="ts">
	import ContactCard from '$lib/client/components/contacts/ContactCard/index.svelte';
	import ContactForm from '$lib/client/components/contacts/ContactForm/index.svelte';
	import { DisplayName, Initials } from '$lib/client/components/contacts/format';
	import { NewContactsPage } from './page.module.svelte';
	import type { Fields } from './models';

	const state: Fields = NewContactsPage();
</script>

<svelte:window onkeydown={state.keydown} />

<div class="flex flex-col gap-6 px-6 py-8">
	<div class="flex items-end justify-between gap-4">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold">Contacts</h1>
			<p class="text-base-content/60">The household's address book.</p>
		</div>

		<button type="button" class="btn btn-primary" onclick={state.create}>
			<svg
				class="size-4"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				aria-hidden="true"
			>
				<path d="M12 5v14M5 12h14" />
			</svg>
			New contact
		</button>
	</div>

	<label class="input w-full max-w-xl">
		<svg
			class="size-4 opacity-50"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			aria-hidden="true"
		>
			<circle cx="11" cy="11" r="7" />
			<path d="M20 20l-3.5-3.5" />
		</svg>
		<input
			type="search"
			class="grow"
			placeholder="Search by name, number, email…"
			aria-label="Search contacts"
			bind:value={state.query}
		/>
	</label>

	{#if state.loading}
		<span class="loading loading-spinner"></span>
	{:else if state.total === 0}
		<p class="text-base-content/60">No contacts yet. Add the first one.</p>
	{:else if state.groups.length === 0}
		<p class="text-base-content/60">Nobody matches “{state.query}”.</p>
	{:else}
		<div class="flex max-w-xl flex-col gap-4">
			{#each state.groups as group (group.letter)}
				<section class="flex flex-col gap-1">
					<h2 class="px-3 text-xs font-semibold text-base-content/50">{group.letter}</h2>

					<ul class="overflow-hidden rounded-box border border-base-300 bg-base-100">
						{#each group.contacts as contact (contact.id)}
							<li class="border-base-300 not-last:border-b">
								<button
									type="button"
									class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-base-200"
									onclick={() => {
										state.view(contact);
									}}
								>
									<span
										class="flex size-9 shrink-0 items-center justify-center rounded-full bg-info/10 text-sm font-semibold text-info"
										aria-hidden="true"
									>
										{Initials(contact)}
									</span>

									<span class="flex min-w-0 flex-col">
										<span class="truncate font-medium">{DisplayName(contact)}</span>
										{#if contact.phoneNumber || contact.organization}
											<span class="truncate text-sm text-base-content/60">
												{contact.phoneNumber || contact.organization}
											</span>
										{/if}
									</span>
								</button>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</div>

{#if state.modal}
	<div class="modal modal-open modal-bottom sm:modal-middle" role="dialog" aria-modal="true">
		<div class="modal-box max-h-[90dvh]">
			{#key state.modal}
				{#if state.modal.mode === 'view'}
					<ContactCard contact={state.modal.contact} onedit={state.edit} onclose={state.close} />
				{:else}
					<ContactForm
						contact={state.modal.mode === 'edit' ? state.modal.contact : null}
						onsaved={state.saved}
						ondeleted={state.deleted}
						oncancel={state.back}
					/>
				{/if}
			{/key}
		</div>
		<button type="button" class="modal-backdrop" aria-label="Close" onclick={state.back}></button>
	</div>
{/if}
