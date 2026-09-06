<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sidebar from './sidebar/Sidebar.svelte';
	import Topbar from './topbar/Topbar.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<!--
	items-start keeps the panel at its own height so it can stick while the page
	scrolls. dvh rather than vh throughout: on mobile 100vh is the toolbar-hidden
	height, which is taller than what you can actually see, so a short page still
	scrolls by the height of the toolbar and drags the panel and title bar up with it.
-->
<div class="flex min-h-[100dvh] items-start bg-base-200">
	<Sidebar />

	<div class="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
		<Topbar />
		<main class="min-w-0 flex-1">{@render children()}</main>
	</div>
</div>
