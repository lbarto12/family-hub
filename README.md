# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@0.17.0 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" playwright tailwindcss="plugins:none" sveltekit-adapter="adapter:auto" drizzle="database:postgresql+postgresql:postgres.js+docker:yes" --install bun .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Deploying

Pushing to `main` builds the app and deploys it to the backroom machine over the
tailnet: artifacts are rsynced to `/opt/family-hub/releases/<sha>`, postgres comes
up under docker compose, migrations run, and a `family-hub` systemd service is
installed and restarted. A failed health check rolls back to the previous release.

See [`deploy/README.md`](deploy/README.md) for the one-time machine setup and the
list of repository secrets. Everything the deploy needs lives in `deploy/`.
