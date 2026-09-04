<script lang="ts">
	import { localtoasts } from './toasts.svelte';
</script>

<div class="toast">
	{#each localtoasts as _toast (_toast)}
		<div class="alert {_toast.type === 'toast' ? 'alert-info' : 'alert-error'}">
			<span>{_toast.message}</span>
		</div>
	{/each}
</div>
