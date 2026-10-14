<script lang="ts">
	import { useContactFormState } from './component.svelte';
	import type { ContactForm, Props } from './models';

	const props: Props = $props();
	// The hook only reads props inside getters and $derived, so it stays reactive
	// svelte-ignore state_referenced_locally
	const form: ContactForm = useContactFormState(props);
</script>

<!-- Autofill stays off throughout: these are someone else's details, not yours -->
<form class="flex flex-col gap-6" autocomplete="off" novalidate onsubmit={form.submit}>
	<h2 class="text-xl font-semibold">{form.isNew ? 'New contact' : 'Edit contact'}</h2>

	{#each form.sections as section (section.title)}
		<fieldset class="fieldset grid gap-x-3 gap-y-2 sm:grid-cols-2">
			<legend class="fieldset-legend">{section.title}</legend>

			{#each section.fields as field (field.key)}
				<label class="flex flex-col gap-1 {field.wide ? 'sm:col-span-2' : ''}">
					<span class="label text-xs">{field.label}</span>
					<input
						class="input w-full"
						type={field.type}
						inputmode={field.type === 'tel' ? 'tel' : undefined}
						bind:value={form.fields[field.key]}
						required={field.key === 'firstName'}
					/>
				</label>
			{/each}
		</fieldset>
	{/each}

	<label class="flex flex-col gap-1">
		<span class="label text-xs">Notes</span>
		<textarea class="textarea w-full" rows="3" bind:value={form.fields.notes}></textarea>
	</label>

	{#if form.error}
		<p class="text-sm text-error" role="alert">{form.error}</p>
	{/if}

	<div class="flex items-center gap-2">
		{#if !form.isNew}
			<button
				type="button"
				class="btn btn-ghost text-error"
				disabled={form.saving}
				onclick={form.remove}
			>
				Delete
			</button>
		{/if}

		<span class="flex-1"></span>

		<button type="button" class="btn btn-ghost" disabled={form.saving} onclick={form.cancel}>
			Cancel
		</button>
		<button type="submit" class="btn btn-primary" disabled={form.saving}>
			{#if form.saving}
				<span class="loading loading-sm loading-spinner"></span>
			{/if}
			Save
		</button>
	</div>
</form>
