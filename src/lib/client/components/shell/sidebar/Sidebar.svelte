<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { links, NewSidebar, type Fields } from './sidebar.svelte';

	const state: Fields = NewSidebar();
</script>

<!--
	The rail keeps a constant width, so the toggle and every link share the same
	horizontal padding: the icons hold their column whether the panel is open or shut
-->
<aside
	class="sticky top-0 flex h-screen shrink-0 flex-col overflow-x-hidden border-r border-base-300 bg-base-100 transition-[width] duration-200 ease-out {state.open
		? 'w-60'
		: 'w-16'}"
>
	<div class="flex h-16 shrink-0 items-center p-2">
		<button
			type="button"
			class="flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-colors hover:bg-base-200"
			aria-label={state.open ? 'Collapse navigation panel' : 'Expand navigation panel'}
			aria-expanded={state.open}
			title={state.open ? 'Collapse' : 'Expand'}
			onclick={state.toggle}
		>
			<svg
				class="size-5 shrink-0"
				fill="none"
				stroke="currentColor"
				stroke-width="1.75"
				stroke-linecap="round"
				stroke-linejoin="round"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
				<path d="M9.5 4v16" />
			</svg>
		</button>
	</div>

	<nav class="flex-1 overflow-x-hidden overflow-y-auto">
		<ul class="flex flex-col gap-1 p-2">
			{#each links as link (link.route)}
				{@const isActive = page.url.pathname === resolve(link.route)}

				<li>
					<a
						class="flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-colors {isActive
							? 'bg-primary/10 font-medium text-primary'
							: 'hover:bg-base-200'}"
						href={resolve(link.route)}
						title={state.open ? undefined : link.label}
						aria-current={isActive ? 'page' : undefined}
					>
						<svg
							class="size-5 shrink-0"
							fill="none"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
							stroke-linejoin="round"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							{#if link.icon === 'dashboard'}
								<path d="M4 4h6v7H4zM14 4h6v5h-6zM14 13h6v7h-6zM4 15h6v5H4z" />
							{:else if link.icon === 'gaming'}
								<path
									d="M7 8h10a4 4 0 0 1 4 4v1a3 3 0 0 1-5.1 2.1l-.9-.9H9l-.9.9A3 3 0 0 1 3 13v-1a4 4 0 0 1 4-4Z"
								/>
								<path d="M7 11.5h3M8.5 10v3M15.5 11.5h.01M17.5 13.5h.01" />
							{/if}
						</svg>

						<span
							class="whitespace-nowrap transition-opacity duration-200 {state.open
								? 'opacity-100'
								: 'opacity-0'}"
						>
							{link.label}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</aside>
