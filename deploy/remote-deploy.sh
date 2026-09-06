#!/usr/bin/env bash
#
# Runs ON the backroom machine, invoked over SSH by .github/workflows/deploy.yml
# once a release has been rsynced into $APP_DIR/releases/$RELEASE.
#
# Installs production deps, brings up the postgres compose project, migrates,
# refreshes the systemd unit, flips the `current` symlink and restarts the
# service — rolling back to the previous release if it fails to come up.
#
# Safe to re-run: every step is idempotent.
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/family-hub}"
RELEASE="${RELEASE:?RELEASE is required}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
SERVICE="${SERVICE:-family-hub}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-family-hub}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-90}"

RELEASES_DIR="$APP_DIR/releases"
NEW_RELEASE="$RELEASES_DIR/$RELEASE"
CURRENT_LINK="$APP_DIR/current"
# Deliberately not named ".env": docker compose auto-loads a .env sitting next
# to the compose file and interpolates ${...} out of its values, which turns a
# secret containing a $ into a compose warning and a lookup of the wrong name.
ENV_FILE="$APP_DIR/app.env"
COMPOSE_FILE="$APP_DIR/compose.yaml"
UNIT_PATH="/etc/systemd/system/$SERVICE.service"

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m warn:\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

[[ -d "$NEW_RELEASE" ]] || die "release not found: $NEW_RELEASE"
[[ -f "$ENV_FILE" ]]    || die "env file not found: $ENV_FILE (the workflow writes this)"

# The previous release, so a failed health check can be rolled back.
PREVIOUS_RELEASE=""
if [[ -L "$CURRENT_LINK" ]]; then
	PREVIOUS_RELEASE="$(readlink -f "$CURRENT_LINK")"
fi

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
# The env file is the single source of truth. POSTGRES_* for compose are derived
# from DATABASE_URL below so the two can never drift apart.
#
# Read, never sourced: the file is written with double-quoted values by the
# workflow, and sourcing it would let a `$` or backtick in a secret expand.
# systemd's EnvironmentFile parser does no such expansion either, so what the
# service sees is exactly what was written.
env_get() {
	local key="$1" line
	line="$(grep -m1 -E "^${key}=" "$ENV_FILE")" || return 1
	line="${line#*=}"
	if [[ "$line" == \"*\" ]]; then line="${line:1:${#line}-2}"; fi
	printf '%s' "$line" | sed -e 's/\\"/"/g' -e 's/\\\\/\\/g'
}

DATABASE_URL="$(env_get DATABASE_URL)" || die "DATABASE_URL is missing from $ENV_FILE"
[[ -n "$DATABASE_URL" ]] || die "DATABASE_URL is empty in $ENV_FILE"
export DATABASE_URL
PORT="$(env_get PORT || true)"
PORT="${PORT:-3000}"

# postgres://user:pass@host:port/db -> POSTGRES_USER / _PASSWORD / _DB.
# Values are percent-decoded, since a URL-encoded password is legal here.
urldecode() {
	local s="$1"
	# %b would also eat literal backslashes, so only decode when there is
	# actually a percent-escape to decode.
	[[ "$s" == *%* ]] || { printf '%s' "$s"; return; }
	printf '%b' "${s//%/\\x}"
}

parse_database_url() {
	local url="$1" rest creds hostpart
	[[ "$url" =~ ^postgres(ql)?:// ]] || die "DATABASE_URL is not a postgres:// URL"
	rest="${url#*://}"
	[[ "$rest" == *"@"* ]] || die "DATABASE_URL has no user:password@ section"
	creds="${rest%%@*}"
	hostpart="${rest#*@}"

	POSTGRES_USER="$(urldecode "${creds%%:*}")"
	POSTGRES_PASSWORD="$(urldecode "${creds#*:}")"
	# strip the host:port prefix, then the query string
	[[ "$hostpart" == *"/"* ]] || die "DATABASE_URL has no /database path"
	local dbpart="${hostpart#*/}"
	POSTGRES_DB="$(urldecode "${dbpart%%\?*}")"

	[[ -n "$POSTGRES_USER" && -n "$POSTGRES_PASSWORD" && -n "$POSTGRES_DB" ]] \
		|| die "could not parse user/password/database out of DATABASE_URL"
	export POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB
}
parse_database_url "$DATABASE_URL"
log "Database '$POSTGRES_DB' as user '$POSTGRES_USER'"

# A non-interactive SSH session sources neither ~/.bashrc nor ~/.profile, so a
# per-user bun install is invisible here even though `bun --version` works when
# you log in. Fall back to the usual install locations before giving up.
find_bun() {
	local candidate
	if candidate="$(command -v bun 2>/dev/null)"; then
		printf '%s' "$candidate"
		return 0
	fi
	for candidate in "$HOME/.bun/bin/bun" /usr/local/bin/bun /usr/bin/bun /opt/bun/bin/bun; do
		if [[ -x "$candidate" ]]; then
			printf '%s' "$candidate"
			return 0
		fi
	done
	return 1
}

BUN="$(find_bun)" || die "cannot find bun for $(whoami).
  It is not on this session's PATH ($PATH) and not in any of the usual places.
  A non-interactive SSH session does not read ~/.bashrc, so if bun lives under
  your home directory, link it somewhere system-wide:
    sudo ln -s \"\$HOME/.bun/bin/bun\" /usr/local/bin/bun"

# Nested tooling expects bun on PATH even though we invoke it by absolute path.
# Appended, never prepended: a global bin directory must not be able to shadow
# coreutils like install(1) for the rest of this script.
PATH="$PATH:$(dirname "$BUN")"
export PATH
log "Using bun at $BUN ($("$BUN" --version))"

# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
# The svelte-adapter-bun output is not self-contained: zod, jose and @orpc/* are
# left as bare imports and resolved at runtime, so the release needs node_modules.
log "Installing production dependencies"
# --ignore-scripts: the root package's "prepare" hook runs svelte-kit sync,
# which is a dev-only tool that is not installed here.
(cd "$NEW_RELEASE" && "$BUN" install --production --frozen-lockfile --ignore-scripts)

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
# Shipped with the release so compose changes deploy like everything else.
[[ -f "$NEW_RELEASE/deploy/compose.yaml" ]] \
	|| die "release is missing deploy/compose.yaml — the workflow did not stage it"
install -m 0644 "$NEW_RELEASE/deploy/compose.yaml" "$COMPOSE_FILE"

# install(1) exiting 0 is not proof the file is there: a shadowed `install` on
# PATH would also succeed quietly.
[[ -f "$COMPOSE_FILE" ]] || die "install reported success but $COMPOSE_FILE does not exist.
  install(1) resolved to: $(command -v install)
  If that is not /usr/bin/install, something on PATH is shadowing coreutils."

log "Starting postgres"
if ! docker compose -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT" up -d --remove-orphans; then
	# The file demonstrably exists — the check above proved it — so a "no such
	# file" from docker means docker cannot *see* it. Snap-packaged docker is
	# confined and cannot read outside $HOME, which looks exactly like this.
	warn "docker compose failed on a file that exists and is readable:"
	ls -l "$COMPOSE_FILE" >&2 || true
	if [[ -e /snap/bin/docker ]] || command -v docker | grep -q '^/snap/'; then
		warn "docker is installed as a snap, which cannot read outside \$HOME."
		warn "Install it from your distro's packages, or set the APP_DIR secret to a"
		warn "path under the deploy user's home directory."
	fi
	die "could not start postgres"
fi

log "Waiting for postgres to accept connections"
deadline=$((SECONDS + 120))
until docker compose -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT" \
	exec -T db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
	(( SECONDS < deadline )) || die "postgres did not become ready within 120s"
	sleep 2
done
log "Postgres is ready"

log "Applying migrations"
(cd "$NEW_RELEASE" && "$BUN" --install=disable run scripts/migrate.ts)

# ---------------------------------------------------------------------------
# systemd unit
# ---------------------------------------------------------------------------
# Rendered fresh each deploy so unit changes ship with the code.
APP_USER="$(id -un)"
APP_GROUP="$(id -gn)"
# Explicitly in /tmp so it matches the path pattern in the sudoers rule.
rendered="$(mktemp /tmp/family-hub-unit.XXXXXX)"
trap 'rm -f "$rendered"' EXIT
# ProtectHome=read-only hides nothing we need when APP_DIR is in /opt, but if the
# release lives under a home directory the unit must not restrict it — snap
# docker forces exactly that layout.
protect_home=read-only
case "$APP_DIR" in
	/home/* | /root/*) protect_home=no ;;
esac

sed \
	-e "s|@PROTECT_HOME@|$protect_home|g" \
	-e "s|@APP_DIR@|$APP_DIR|g" \
	-e "s|@APP_USER@|$APP_USER|g" \
	-e "s|@APP_GROUP@|$APP_GROUP|g" \
	-e "s|@BUN@|$BUN|g" \
	"$NEW_RELEASE/deploy/family-hub.service" > "$rendered"

if ! cmp -s "$rendered" "$UNIT_PATH" 2>/dev/null; then
	log "Installing systemd unit at $UNIT_PATH"
	sudo install -m 0644 -o root -g root "$rendered" "$UNIT_PATH"
	sudo systemctl daemon-reload
else
	log "systemd unit unchanged"
fi
# Idempotent, and guards against the unit having been disabled by hand.
sudo systemctl enable "$SERVICE" >/dev/null

# ---------------------------------------------------------------------------
# Cut over
# ---------------------------------------------------------------------------
activate() {
	local target="$1"
	ln -sfn "$target" "$CURRENT_LINK.tmp"
	mv -Tf "$CURRENT_LINK.tmp" "$CURRENT_LINK"
}

healthy() {
	local deadline=$((SECONDS + HEALTH_TIMEOUT))
	while (( SECONDS < deadline )); do
		if ! systemctl is-active --quiet "$SERVICE"; then
			sleep 2
			continue
		fi
		if curl -fsS -o /dev/null --max-time 5 "http://127.0.0.1:$PORT/" 2>/dev/null; then
			return 0
		fi
		sleep 2
	done
	return 1
}

log "Activating release $RELEASE"
activate "$NEW_RELEASE"
sudo systemctl restart "$SERVICE"

if healthy; then
	log "Health check passed on http://127.0.0.1:$PORT/"
else
	warn "Health check failed after ${HEALTH_TIMEOUT}s — recent logs:"
	journalctl -u "$SERVICE" -n 60 --no-pager >&2 || true
	if [[ -n "$PREVIOUS_RELEASE" && -d "$PREVIOUS_RELEASE" && "$PREVIOUS_RELEASE" != "$NEW_RELEASE" ]]; then
		warn "Rolling back to $(basename "$PREVIOUS_RELEASE")"
		activate "$PREVIOUS_RELEASE"
		sudo systemctl restart "$SERVICE"
		if healthy; then
			warn "Rollback is serving; the new release was not activated."
		else
			warn "Rollback also failed to come up."
		fi
	fi
	die "deploy failed"
fi

# ---------------------------------------------------------------------------
# Tailscale serve
# ---------------------------------------------------------------------------
# Re-asserted every deploy so a reset or a never-configured machine repairs
# itself. `--bg` config survives reboots on its own, so this is normally a no-op.
if command -v tailscale >/dev/null 2>&1; then
	if tailscale serve status 2>/dev/null | grep -q "127.0.0.1:$PORT"; then
		log "tailscale serve already fronting 127.0.0.1:$PORT"
	else
		log "Pointing tailscale serve at 127.0.0.1:$PORT"
		tailscale serve --bg "$PORT" \
			|| warn "tailscale serve failed; run it yourself: tailscale serve --bg $PORT"
	fi
else
	warn "tailscale is not on PATH; skipping serve setup"
fi

# ---------------------------------------------------------------------------
# Prune
# ---------------------------------------------------------------------------
log "Pruning old releases (keeping $KEEP_RELEASES)"
active="$(readlink -f "$CURRENT_LINK")"
# shellcheck disable=SC2012
ls -1dt "$RELEASES_DIR"/*/ 2>/dev/null | tail -n "+$((KEEP_RELEASES + 1))" | while read -r old; do
	old="${old%/}"
	[[ "$(readlink -f "$old")" == "$active" ]] && continue
	log "  removing $(basename "$old")"
	rm -rf "$old"
done

log "Deployed $RELEASE"
systemctl status "$SERVICE" --no-pager --lines=0 || true
