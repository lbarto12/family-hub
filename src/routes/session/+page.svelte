<script lang="ts">
	import { NewLoginPage, type Fields } from './page.module.svelte';
	const state: Fields = NewLoginPage();
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-base-200 px-6 py-8">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body">
			<h1 class="card-title text-2xl">Sign in to your account</h1>

			<form class="flex flex-col gap-4" onsubmit={state.login}>
				<div class="w-full">
					<label class="label" for="email">Your email</label>
					<input
						type="email"
						id="email"
						placeholder="name@domain.com"
						class="input w-full"
						required
						bind:value={state.email}
					/>
				</div>

				<div class="w-full">
					<label class="label" for="password">Password</label>
					<input
						type="password"
						id="password"
						placeholder="••••••••"
						class="input w-full"
						required
						bind:value={state.password}
					/>
				</div>

				<button type="submit" class="btn w-full btn-primary">Sign in</button>
			</form>
		</div>
	</div>
</div>
