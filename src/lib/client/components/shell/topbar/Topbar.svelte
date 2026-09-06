<script lang="ts">
	import { NewTopbar, type Fields } from './topbar.svelte';

	const state: Fields = NewTopbar();

	// Read only from event handlers, so a plain binding rather than $state
	let profile: HTMLDivElement | undefined;

	// Pointerdown rather than click so a press that starts outside always closes,
	// even when the release lands elsewhere
	const clickaway = (event: PointerEvent): undefined => {
		if (!(event.target instanceof Node)) return;
		if (!profile?.contains(event.target)) state.closeProfile();
	};

	const keydown = (event: KeyboardEvent): undefined => {
		if (event.key === 'Escape') state.closeProfile();
	};
</script>

<svelte:window onpointerdown={clickaway} onkeydown={keydown} />

<header
	class="navbar sticky top-0 z-10 min-h-16 border-b border-base-300 bg-base-100 px-4 shadow-sm"
>
	<div class="navbar-start">
		<span class="text-xl font-semibold">Family Hub</span>
	</div>

	<div class="navbar-end">
		<div class="dropdown dropdown-end" bind:this={profile}>
			<button
				type="button"
				class="btn avatar avatar-placeholder btn-circle btn-ghost"
				aria-label="Toggle profile menu"
				aria-expanded={state.profileOpen}
				onclick={state.toggleProfile}
			>
				<div class="w-10 rounded-full bg-neutral text-neutral-content">
					<span class="text-sm">{state.initials}</span>
				</div>
			</button>

			{#if state.profileOpen}
				<ul class="menu dropdown-content z-1 mt-3 w-52 gap-1 rounded-box bg-base-100 p-2 shadow">
					{#if state.user}
						<li class="menu-title">{state.user.firstName} {state.user.lastName}</li>
					{/if}
					<li><button type="button" onclick={state.profile}>Profile</button></li>
					<li><button type="button" onclick={state.signOut}>Sign out</button></li>
				</ul>
			{/if}
		</div>
	</div>
</header>
