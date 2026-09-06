<script lang="ts">
	import Navbar from '$lib/client/components/navbar/Navbar.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div>
	<Navbar />
	{@render children()}
</div>
