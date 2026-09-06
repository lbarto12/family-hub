# Deploying to the backroom machine

A push to `main` builds the app on a GitHub runner, joins your tailnet, ships the
release to the machine over SSH and restarts a systemd service there. Postgres
runs alongside it in docker compose.

```
GitHub runner                          backroom machine
─────────────                          ────────────────
bun install / lint / check / test
bun run build            ──rsync──▶    /opt/family-hub/releases/<sha>/
write app.env            ──ssh───▶     /opt/family-hub/app.env   (0600)
                         ──ssh───▶     remote-deploy.sh
                                         bun install --production
                                         docker compose up -d      (postgres)
                                         bun run scripts/migrate.ts
                                         install family-hub.service
                                         current -> releases/<sha>
                                         systemctl restart family-hub
                                         health check, else roll back
                                       tailscale serve ──▶ 127.0.0.1:3000
```

## Files

| File                 | What it is                                                        |
| -------------------- | ----------------------------------------------------------------- |
| `bootstrap.sh`       | One-time machine setup. Prints every secret the workflow needs.   |
| `remote-deploy.sh`   | Runs on the machine on every deploy. Idempotent, safe to re-run.  |
| `with-env.sh`        | Runs a command with `app.env` loaded, for admin tasks.            |
| `compose.yaml`       | Production postgres. Bound to loopback only.                      |
| `family-hub.service` | systemd unit template; `@PLACEHOLDERS@` filled in at deploy time. |

## One-time setup

`bootstrap.sh` has to run on the machine before the first deploy — it is what
creates the SSH key the workflow authenticates with. It needs no other file from
the repo, so any of these work.

**Copy it over the tailnet** (nothing needs to be pushed first):

```sh
scp deploy/bootstrap.sh <machine>:/tmp/
ssh -t <machine> 'bash /tmp/bootstrap.sh'
```

**Or fetch it on the machine**, once this is on `main` (the repo is public):

```sh
ssh -t <machine>
curl -fsSL -o /tmp/bootstrap.sh \
  https://raw.githubusercontent.com/lbarto12/family-hub/main/deploy/bootstrap.sh
bash /tmp/bootstrap.sh
```

**Or clone the repo** if you want it on the box anyway:

```sh
git clone https://github.com/lbarto12/family-hub.git
cd family-hub && ./deploy/bootstrap.sh
```

Run it from a terminal rather than piping it into `bash` — sudo and `ssh-keygen`
want a tty. It checks its prerequisites first and exits without touching anything
if docker, bun, rsync, curl, tailscale or sudo are missing, so a dry first run is
safe.

It creates `/opt/family-hub`, grants the deploy user a narrow sudo rule for this
one service, generates an SSH key for the workflow, points `tailscale serve` at
port 3000, and prints the secrets to paste into the repository.

In the Tailscale admin console, create an OAuth client with the
**Keys > Auth Keys > Write** scope and the `tag:ci` tag. The action trades those
credentials for an ephemeral auth key, so `auth_keys` is the scope it needs —
the `devices` scope no longer covers this.

`tag:ci` has to exist in your policy file before the tag picker will offer it.

Tailscale SSH intercepts port 22, so a network grant alone is not enough — an
`ssh` rule is needed too. In an `ssh` rule the destination must be a **tag**
whenever the source is a tag (`autogroup:self` only works when the source is
users or groups), so the machine has to be tagged as well:

```json
{
	"tagOwners": {
		"tag:ci": ["autogroup:owner"],
		"tag:hub": ["autogroup:owner"]
	},
	"grants": [
		{
			"src": ["tag:ci"],
			"dst": ["tag:hub"],
			"ip": ["tcp:22"]
		}
	],
	"ssh": [
		{
			"action": "accept",
			"src": ["tag:ci"],
			"dst": ["tag:hub"],
			"users": ["user"]
		},
		{
			"action": "accept",
			"src": ["autogroup:member"],
			"dst": ["tag:hub"],
			"users": ["autogroup:nonroot"]
		}
	]
}
```

Then tag the machine under **Machines > (the machine) > Edit ACL tags** with
`tag:hub`.

The second `ssh` rule matters: tagging a device transfers it from user ownership
to tag ownership, and `autogroup:self` stops matching it. Without that rule you
lose your own SSH access to the machine. It is recoverable from the admin
console, but easier not to trip over.

`action` must be `accept`, not `check` — `check` demands periodic interactive
re-authentication, which no unattended deploy can satisfy.

Because Tailscale SSH authenticates the runner by its tailnet identity, no SSH
private key is involved and `DEPLOY_SSH_KEY` can be left unset. Set it only if
you turn Tailscale SSH off (`tailscale up --ssh=false`) and let plain sshd serve
port 22.

Then push to `main`.

## Secrets

Set under **Settings > Secrets and variables > Actions**.

| Secret               | Example                                              |
| -------------------- | ---------------------------------------------------- |
| `DEPLOY_HOST`        | `backroom.tailXXXX.ts.net`                           |
| `DEPLOY_USER`        | `liam`                                               |
| `DEPLOY_SSH_KEY`     | only when not using Tailscale SSH — see above        |
| `TS_OAUTH_CLIENT_ID` | from the Tailscale admin console                     |
| `TS_OAUTH_SECRET`    | from the Tailscale admin console                     |
| `DATABASE_URL`       | `postgres://hub:<password>@127.0.0.1:5432/familyhub` |
| `JWT_SECRET`         | 32 random bytes, base64url                           |
| `APP_ORIGIN`         | `https://backroom.tailXXXX.ts.net`                   |

Optional, with the defaults the workflow uses if unset: `JWT_ISSUER`
(`family-hub-auth`), `JWT_AUDIENCE` (`family-hub-app`), `JWT_ACCESS_TOKEN_TTL`
(`15m`), `REFRESH_TOKEN_TTL_DAYS` (`30`), `APP_DIR` (`/opt/family-hub`),
`APP_PORT` (`3000`), `DEPLOY_SSH_KNOWN_HOSTS` (pins the host key instead of
trusting it on first contact).

`DATABASE_URL` is the single source of truth for the database: the deploy script
parses the user, password and database name out of it and hands those to the
postgres container, so the two can never drift apart. Percent-encoded passwords
are decoded correctly.

> Postgres keeps the credentials it was initialised with. Changing the password
> in `DATABASE_URL` later does not change it in the existing volume — you have to
> `ALTER ROLE` in the running database too.

## On the machine

```
/opt/family-hub/
├── app.env                 # secrets, 0600, written by the workflow
├── compose.yaml            # copied from the release each deploy
├── current -> releases/<sha>
└── releases/
    └── <sha>/              # build/, src/, scripts/, deploy/, node_modules/
```

`app.env` is deliberately not called `.env`: docker compose auto-loads a `.env`
sitting next to the compose file and interpolates `${...}` out of its values,
which mangles secrets containing a `$`.

Never `source` `app.env` — the shell expands `$` and backticks inside the values,
so a password of `pa$$word` silently becomes the shell's PID. Use `with-env.sh`,
which parses and unescapes the file instead.

The five most recent releases are kept; `current` is a symlink, so activation and
rollback are atomic.

## Operating it

```sh
systemctl status family-hub
journalctl -u family-hub -f

# database
docker compose -f /opt/family-hub/compose.yaml -p family-hub ps
docker compose -f /opt/family-hub/compose.yaml -p family-hub logs -f

# create the first admin user (needs a terminal — it prompts)
cd /opt/family-hub/current && ./deploy/with-env.sh bun run db:admin

# roll back by hand
ln -sfn /opt/family-hub/releases/<older-sha> /opt/family-hub/current.tmp
mv -Tf /opt/family-hub/current.tmp /opt/family-hub/current
sudo systemctl restart family-hub
```

A deploy whose health check fails rolls itself back to the previous release and
fails the workflow, so a bad build does not take the app down.

## Snap-packaged docker

Docker installed from a snap is confined and cannot read files outside `$HOME`.
It reports such a file as "no such file or directory" even when it exists and is
world-readable, so `docker compose -f /opt/family-hub/compose.yaml` fails in a
way that looks like a missing file.

If `command -v docker` prints something under `/snap/`, either replace it with
your distro's packages, or set the `APP_DIR` repository variable to a path under
the deploy user's home directory and re-run bootstrap with it:

```sh
APP_DIR=$HOME/family-hub ./deploy/bootstrap.sh
```

The deploy script drops `ProtectHome` from the systemd unit automatically when
`APP_DIR` is under `/home`, so the service can still read its own release.

## Notes

- The app binds `127.0.0.1` only. `tailscale serve` terminates TLS in front of
  it, so nothing is exposed beyond the tailnet and there is no cert to manage.
- `svelte-adapter-bun`'s output is not self-contained — `zod`, `jose` and
  `@orpc/*` stay as bare imports — so the release carries `package.json` and
  `bun.lock` and runs `bun install --production` on the machine (26 packages).
- Keep the bun version in `.github/workflows/deploy.yml` in step with the bun on
  the machine.
- `drizzle-orm` and `postgres` moved from `devDependencies` to `dependencies`, so
  `bun install --production` and `scripts/migrate.ts` get them on the machine.
  `bun.lock` still lists them under `devDependencies`; bun tolerates that and
  resolves the production set from `package.json`, and `--frozen-lockfile` passes.
  Regenerating the lockfile from scratch would upgrade a lot of unrelated
  packages, so it was left pinned.
- The dev `compose.yaml` at the repo root uses the unpinned `postgres` image
  while production pins `postgres:18-alpine`. Worth pinning dev to match when you
  next reset your local volume.
