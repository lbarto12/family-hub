<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sidebar from './sidebar/Sidebar.svelte';
	import Topbar from './topbar/Topbar.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<!-- items-start keeps the panel at its own h-screen so it can stick while the page scrolls -->
<div class="flex min-h-screen items-start bg-base-200">
	<Sidebar />

	<div class="flex min-h-screen min-w-0 flex-1 flex-col">
		<Topbar />
		<main class="min-w-0 flex-1">{@render children()}</main>
	</div>
</div>
