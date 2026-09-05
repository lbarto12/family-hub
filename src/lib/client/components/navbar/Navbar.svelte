<script lang="ts">
	import { resolve } from '$app/paths';
	import { NewNavbar, type Fields } from './navbar.svelte';

	const state: Fields = NewNavbar();

	// Read only from event handlers, so plain bindings rather than $state
	let menu: HTMLDivElement | undefined;
	let profile: HTMLDivElement | undefined;

	// Pointerdown rather than click so a press that starts outside always closes,
	// even when the release lands elsewhere
	const clickaway = (event: PointerEvent): undefined => {
		if (!(event.target instanceof Node)) return;

		if (!menu?.contains(event.target)) state.closeMenu();
		if (!profile?.contains(event.target)) state.closeProfile();
	};

	const keydown = (event: KeyboardEvent): undefined => {
		if (event.key === 'Escape') state.close();
	};
</script>

<svelte:window onpointerdown={clickaway} onkeydown={keydown} />

<nav class="navbar bg-base-100 shadow-sm">
	<div class="navbar-start">
		<div class="dropdown" bind:this={menu}>
			<button
				type="button"
				class="btn btn-ghost lg:hidden"
				aria-label="Toggle navigation menu"
				aria-expanded={state.menuOpen}
				onclick={state.toggleMenu}
			>
				<svg
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>

			{#if state.menuOpen}
				<ul class="menu dropdown-content z-1 mt-3 w-52 gap-1 rounded-box bg-base-100 p-2 shadow">
					<!-- collapsed navigation options go here -->
				</ul>
			{/if}
		</div>

		<a class="btn btn-ghost text-xl" href={resolve('/dashboard')}>skel</a>
	</div>

	<div class="navbar-center hidden lg:flex">
		<ul class="menu menu-horizontal gap-1 px-1">
			<!-- navigation options go here -->
		</ul>
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
</nav>
