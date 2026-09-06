<script lang="ts">
	import Shell from '$lib/client/components/shell/Shell.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<Shell>{@render children()}</Shell>
