<script lang="ts">
	import { greet } from './greet';

	interface Props {
		host: string | undefined;
		guest: string | undefined;
	}

	let { host = 'SvelteKit', guest = 'Vitest' }: Props = $props();
</script>

<h1>{greet(host)}</h1>
<p>{greet(guest)}</p>
