<script lang="ts">
	import Navbar from '$lib/client/components/navbar/Navbar.svelte';
	import { NewProfilePage, type Fields } from './page.module.svelte';

	const state: Fields = NewProfilePage();
</script>

<Navbar />

<div class="flex min-h-screen flex-col items-center bg-base-200 px-6 py-8">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body">
			<h1 class="card-title text-2xl">Your profile</h1>

			{#if state.loading}
				<span class="loading loading-spinner"></span>
			{:else if state.user}
				<div class="flex flex-col gap-4">
					<div class="w-full">
						<span class="label">First name</span>
						<p>{state.user.firstName}</p>
					</div>

					<div class="w-full">
						<span class="label">Last name</span>
						<p>{state.user.lastName}</p>
					</div>

					<div class="w-full">
						<span class="label">Email</span>
						<p>{state.user.email}</p>
					</div>

					<div class="w-full">
						<span class="label">Phone number</span>
						<p>{state.user.phoneNumber}</p>
					</div>
				</div>
			{:else}
				<p>We could not load your profile.</p>
			{/if}
		</div>
	</div>
</div>
