<script lang="ts">
	import { VAULT_URL } from '$lib/types/hub/services';

	const steps: { title: string; detail: string }[] = [
		{
			title: 'Open the vault and sign in',
			detail:
				'Use the email you were invited with and the master password you chose. If you have not set a password yet, register with that same email — any other address will be refused.'
		},
		{
			title: 'Find the shared logins',
			detail:
				'Anything in the Family collection is shared with the household. Items you add to "My vault" stay private to you.'
		},
		{
			title: 'Set up your phone',
			detail:
				'Install the official Bitwarden app, point it at this server, then turn on autofill — that is what fills logins for you instead of copying and pasting.'
		}
	];

	const phoneSteps: string[] = [
		'Install Bitwarden from the App Store or Play Store.',
		'On the login screen, open the server or region selector (it defaults to bitwarden.com) and choose self-hosted.',
		'Enter the server address shown above, save, then sign in with your email and master password.',
		'Turn on autofill when the app offers — on iOS via Settings, Passwords, AutoFill; on Android via the autofill service prompt.'
	];
</script>

<div class="flex flex-col gap-8 px-6 py-8">
	<div class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold">Passwords</h1>
		<p class="max-w-2xl text-base-content/70">
			The household's shared logins live in a private vault running on the family server. Only
			people who have been invited can see it, and everything is encrypted before it leaves your
			device.
		</p>
	</div>

	<div
		class="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-box border border-base-300 bg-base-100 p-5"
	>
		<div class="flex min-w-0 flex-col gap-1">
			<span class="text-xs text-base-content/60">Server address</span>
			<code class="font-mono text-sm break-all select-all">{VAULT_URL}</code>
		</div>

		<!-- The vault is a separate service on its own origin, so this href
		     cannot go through resolve() the way an internal route does -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a class="btn ml-auto btn-primary" href={VAULT_URL} target="_blank" rel="noopener noreferrer">
			Open the vault
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</div>

	<section class="flex flex-col gap-4">
		<h2 class="text-lg font-medium">Getting started</h2>

		<ol class="flex flex-col gap-3">
			{#each steps as step, index (step.title)}
				<li class="flex gap-4 rounded-box border border-base-300 bg-base-100 p-4">
					<span
						class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
					>
						{index + 1}
					</span>
					<span class="flex flex-col gap-1">
						<span class="font-medium">{step.title}</span>
						<span class="text-sm text-base-content/60">{step.detail}</span>
					</span>
				</li>
			{/each}
		</ol>
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-medium">On your phone</h2>
		<p class="max-w-2xl text-sm text-base-content/60">
			The app will not find this vault on its own — it looks at Bitwarden's own servers unless you
			tell it otherwise. This is the step people get stuck on.
		</p>

		<ol class="flex list-decimal flex-col gap-2 pl-5 text-sm marker:text-base-content/40">
			{#each phoneSteps as step (step)}
				<li class="pl-1">{step}</li>
			{/each}
		</ol>
	</section>

	<div class="rounded-box border border-warning/40 bg-warning/10 p-4 text-sm">
		<p class="font-medium">Your master password cannot be recovered</p>
		<p class="mt-1 text-base-content/70">
			It never reaches the server, so nobody — including whoever runs this hub — can reset it or
			read your vault without it. Choose something you will remember, and set up an emergency
			contact from your account settings.
		</p>
	</div>
</div>
