<script lang="ts">
	import { API } from '$lib/client/linker.client';
	import type { HealthCheckResponse } from '$lib/types/rpcs/public/health/ping';

	const p: Promise<HealthCheckResponse> = API.public.health.check.Get();
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

{#await p}
	Waiting for server...
{:then res}
	Server responded: {res.check}
{:catch error}
	Server errored: {error}
{/await}
