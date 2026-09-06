#!/usr/bin/env bash
#
# Runs a command with the deployed environment loaded, for admin tasks on the
# machine:
#
#   cd $APP_DIR/current
#   ../releases/*/deploy/with-env.sh bun run db:admin
#   ./deploy/with-env.sh psql "$DATABASE_URL"
#
# Reads $APP_DIR/app.env without sourcing it. Sourcing would let the shell
# expand a `$` or backtick inside a secret — `pa$$word` becomes the shell's PID
# — so values are parsed and unescaped instead.
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/family-hub}"
ENV_FILE="${ENV_FILE:-$APP_DIR/app.env}"

[[ -f "$ENV_FILE" ]] || {
	printf 'error: %s not found. Set APP_DIR if the release lives elsewhere.\n' "$ENV_FILE" >&2
	exit 1
}
(($#)) || {
	printf 'usage: %s <command> [args...]\n' "$0" >&2
	exit 2
}

while IFS= read -r line; do
	# Skip comments and anything that is not KEY=...
	[[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] || continue
	key="${line%%=*}"
	value="${line#*=}"
	# Strip the surrounding double quotes the workflow writes, then undo the
	# only two escapes it applies.
	if [[ "$value" == \"*\" ]]; then value="${value:1:${#value}-2}"; fi
	value="$(printf '%s' "$value" | sed -e 's/\\"/"/g' -e 's/\\\\/\\/g')"
	export "$key=$value"
done < "$ENV_FILE"

exec "$@"
