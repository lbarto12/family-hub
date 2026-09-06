<script lang="ts">
	import ServerDetail from './ServerDetail.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

{#key data.slug}
	<ServerDetail slug={data.slug} />
{/key}
