<script lang="ts">
	import type { GameServerSlug } from '$lib/types/rpcs/private/gaming/servers';

	interface Props {
		slug: GameServerSlug;
		class?: string;
	}

	let { slug, class: className = 'size-12' }: Props = $props();
</script>

<!--
	Drawn rather than sourced: these are stylised marks for the two registered
	servers, not the games' own artwork. A new server adds a case here.
-->
<svg class={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
	{#if slug === 'minecraft'}
		<!-- evenodd cuts the eyes and mouth out of the head rather than stacking on it -->
		<path
			fill="currentColor"
			fill-rule="evenodd"
			d="M4.5 3h15a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-15A1.5 1.5 0 0 1 4.5 3ZM6.5 8h3.5v3.5H6.5V8Zm7.5 0h3.5v3.5H14V8Zm-3.5 4.5h3V15h-3v-2.5ZM8 15h2.5v3H8v-3Zm5.5 0H16v3h-2.5v-3Z"
		/>
	{:else if slug === 'valheim'}
		<g fill="currentColor">
			<!-- horns -->
			<path
				d="M6.2 10.6C4.5 10.1 3.1 8.7 2.6 6.9c-.15-.55.4-1 .9-.75 1.5.75 2.9 1.9 3.9 3.35a6 6 0 0 0-1.2 1.1Z"
			/>
			<path
				d="M17.8 10.6c1.7-.5 3.1-1.9 3.6-3.7.15-.55-.4-1-.9-.75-1.5.75-2.9 1.9-3.9 3.35a6 6 0 0 1 1.2 1.1Z"
			/>
			<!-- helm dome and nose guard -->
			<path
				d="M12 6.5a6.5 6.5 0 0 0-6.5 6.5v2.2c0 .5.4.9.9.9h3.3v-3.3c0-.5.4-.9.9-.9h2.8c.5 0 .9.4.9.9v3.3h3.3c.5 0 .9-.4.9-.9V13A6.5 6.5 0 0 0 12 6.5Z"
				opacity="0.9"
			/>
			<path d="M11.1 17.2h1.8c.5 0 .9.4.9.9v2.4a1.8 1.8 0 0 1-3.6 0v-2.4c0-.5.4-.9.9-.9Z" />
		</g>
	{/if}
</svg>
