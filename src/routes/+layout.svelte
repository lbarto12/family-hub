<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { Snippet } from 'svelte';
	import Toaster from '$lib/client/components/toasts/Toaster.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div>
	<Toaster />
	{@render children()}
</div>
