#!/usr/bin/env bash
#
# One-time setup for the backroom machine. Run it there, once, as a user with
# sudo. It needs no other file from the repo, so copying just this script is
# enough:
#
#   # from your dev machine, over the tailnet
#   scp deploy/bootstrap.sh <machine>:/tmp/
#   ssh -t <machine> 'bash /tmp/bootstrap.sh'
#
#   # or on the machine itself, once this is on main
#   curl -fsSL -o /tmp/bootstrap.sh \
#     https://raw.githubusercontent.com/lbarto12/family-hub/main/deploy/bootstrap.sh
#   bash /tmp/bootstrap.sh
#
# Run it from a terminal, not a pipe — sudo and ssh-keygen want a tty.
#
# Creates the deploy directories, grants the deploy user the narrow sudo rights
# the workflow needs, and prints the SSH public key + settings to put into the
# repository's GitHub secrets. Everything after this is done by the workflow.
#
# Safe to re-run.
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/family-hub}"
DEPLOY_USER="${DEPLOY_USER:-$(id -un)}"
SERVICE="${SERVICE:-family-hub}"
APP_PORT="${APP_PORT:-3000}"
SSH_KEY_COMMENT="${SSH_KEY_COMMENT:-github-actions-deploy}"

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m warn:\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -ne 0 ]] || die "run this as your normal user, not root — it uses sudo where needed"

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------
log "Checking prerequisites"
missing=()
for cmd in bun docker rsync curl tailscale systemctl sudo; do
	command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
done
if ((${#missing[@]})); then
	die "missing commands: ${missing[*]}
  bun:       curl -fsSL https://bun.sh/install | bash   (then move it somewhere on the system PATH, e.g. /usr/local/bin)
  docker:    your distro's docker + docker-compose-plugin packages
  tailscale: https://tailscale.com/download"
fi

BUN="$(command -v bun)"
case "$BUN" in
	/usr/local/bin/* | /usr/bin/* | /bin/* | /opt/*) ;;
	*)
		warn "bun is at $BUN, outside the system PATH."
		warn "The deploy runs over a non-interactive SSH session, which reads neither"
		warn "~/.bashrc nor ~/.profile — so bun will not be found there even though it"
		warn "works when you log in. The deploy script checks the usual fallbacks, but"
		warn "linking it system-wide is the reliable fix:"
		warn "  sudo ln -s \"$BUN\" /usr/local/bin/bun"
		;;
esac
log "bun $("$BUN" --version) at $BUN"

# What a deploy actually sees: no rc files, just sshd's default PATH.
if ! env -i PATH=/usr/local/bin:/usr/bin:/bin bash -c 'command -v bun' >/dev/null 2>&1; then
	warn "Confirmed: bun is NOT reachable from a non-interactive shell."
	warn "Link it system-wide with the command above before the first deploy."
fi

docker info >/dev/null 2>&1 || die "cannot talk to docker as $(id -un).
  Fix with:  sudo usermod -aG docker $(id -un)   then log out and back in."
log "docker reachable as $(id -un)"

# The workflow reaches this machine over SSH, so sshd has to be running and
# enabled at boot. The unit is called sshd on Arch/Fedora/RHEL and ssh on Debian.
sshd_unit=""
for unit in sshd ssh; do
	if systemctl list-unit-files "$unit.service" >/dev/null 2>&1 \
		&& systemctl cat "$unit.service" >/dev/null 2>&1; then
		sshd_unit="$unit"
		break
	fi
done
if [[ -z "$sshd_unit" ]]; then
	warn "No sshd/ssh systemd unit found. Install and enable an SSH server, or the"
	warn "deploy workflow will not be able to reach this machine."
elif systemctl is-active --quiet "$sshd_unit"; then
	log "$sshd_unit is running"
	systemctl is-enabled --quiet "$sshd_unit" \
		|| warn "$sshd_unit is not enabled at boot: sudo systemctl enable $sshd_unit"
else
	warn "$sshd_unit is installed but not running. Start it with:"
	warn "  sudo systemctl enable --now $sshd_unit"
fi

# ---------------------------------------------------------------------------
# Directories
# ---------------------------------------------------------------------------
log "Creating $APP_DIR"
sudo install -d -m 0755 -o "$DEPLOY_USER" -g "$(id -gn "$DEPLOY_USER")" "$APP_DIR" "$APP_DIR/releases"

# Journal access, so the deploy script can show logs when a health check fails.
if ! id -nG "$DEPLOY_USER" | tr ' ' '\n' | grep -qx systemd-journal; then
	log "Adding $DEPLOY_USER to the systemd-journal group"
	sudo usermod -aG systemd-journal "$DEPLOY_USER"
	warn "Group change takes effect on next login."
fi

# ---------------------------------------------------------------------------
# sudo rights
# ---------------------------------------------------------------------------
# Only what remote-deploy.sh actually invokes: managing this one unit, and
# writing this one unit file.
SYSTEMCTL="$(command -v systemctl)"
INSTALL_BIN="$(command -v install)"
SUDOERS_FILE="/etc/sudoers.d/$SERVICE-deploy"

log "Installing sudo rules at $SUDOERS_FILE"
tmp_sudoers="$(mktemp)"
trap 'rm -f "$tmp_sudoers"' EXIT
cat > "$tmp_sudoers" <<EOF
# Managed by deploy/bootstrap.sh from the family-hub repo.
# Lets the deploy user manage exactly one service and write exactly one unit file.
Cmnd_Alias FAMILY_HUB_DEPLOY = \\
    $SYSTEMCTL daemon-reload, \\
    $SYSTEMCTL enable $SERVICE, \\
    $SYSTEMCTL enable $SERVICE.service, \\
    $SYSTEMCTL disable $SERVICE, \\
    $SYSTEMCTL disable $SERVICE.service, \\
    $SYSTEMCTL start $SERVICE, \\
    $SYSTEMCTL start $SERVICE.service, \\
    $SYSTEMCTL stop $SERVICE, \\
    $SYSTEMCTL stop $SERVICE.service, \\
    $SYSTEMCTL restart $SERVICE, \\
    $SYSTEMCTL restart $SERVICE.service, \\
    $INSTALL_BIN -m 0644 -o root -g root /tmp/* /etc/systemd/system/$SERVICE.service

$DEPLOY_USER ALL=(root) NOPASSWD: FAMILY_HUB_DEPLOY
EOF
sudo visudo -cqf "$tmp_sudoers" || die "generated sudoers file is invalid — nothing was installed"
sudo install -m 0440 -o root -g root "$tmp_sudoers" "$SUDOERS_FILE"
log "sudo rules installed"

# ---------------------------------------------------------------------------
# SSH key for the workflow
# ---------------------------------------------------------------------------
KEY_PATH="$HOME/.ssh/${SERVICE}_deploy_ed25519"
if [[ -f "$KEY_PATH" ]]; then
	log "Reusing existing deploy key at $KEY_PATH"
else
	log "Generating a deploy key at $KEY_PATH"
	install -d -m 0700 "$HOME/.ssh"
	ssh-keygen -t ed25519 -N '' -C "$SSH_KEY_COMMENT" -f "$KEY_PATH" >/dev/null
fi

AUTH_KEYS="$HOME/.ssh/authorized_keys"
touch "$AUTH_KEYS" && chmod 0600 "$AUTH_KEYS"
if ! grep -qxF "$(cat "$KEY_PATH.pub")" "$AUTH_KEYS"; then
	log "Authorising the deploy key"
	cat "$KEY_PATH.pub" >> "$AUTH_KEYS"
fi

# ---------------------------------------------------------------------------
# Tailscale serve
# ---------------------------------------------------------------------------
# Self.DNSName is the first DNSName in the JSON. Note the whitespace after the
# colon — Go pretty-prints as `"DNSName": "value"`, so the pattern has to allow
# it, and the name comes back with a trailing dot.
TS_HOST="$(tailscale status --json 2>/dev/null \
	| grep -om1 '"DNSName"[[:space:]]*:[[:space:]]*"[^"]*"' \
	| sed -e 's/.*:[[:space:]]*"//' -e 's/"$//' -e 's/\.$//')" || true

if [[ -z "${TS_HOST:-}" ]]; then
	warn "Could not read this machine's tailnet name — is tailscale up? Run: sudo tailscale up"
	TS_HOST="<machine>.<tailnet>.ts.net"
else
	log "Tailnet name: $TS_HOST"
fi

# Independent of the name lookup: serve still needs setting up even if the name
# could not be read.
if tailscale serve status 2>/dev/null | grep -q "127.0.0.1:$APP_PORT"; then
	log "tailscale serve already fronting 127.0.0.1:$APP_PORT"
else
	log "Pointing tailscale serve at 127.0.0.1:$APP_PORT"
	tailscale serve --bg "$APP_PORT" \
		|| warn "tailscale serve failed; run it yourself: tailscale serve --bg $APP_PORT"
fi

# ---------------------------------------------------------------------------
# What to do next
# ---------------------------------------------------------------------------
cat <<EOF

$(printf '\033[1;32mBootstrap complete.\033[0m')

Add these to the repository at Settings > Secrets and variables > Actions.

  Secrets
    DEPLOY_SSH_KEY        only if Tailscale SSH is off — the key below, in full
    DEPLOY_HOST           $TS_HOST
    DEPLOY_USER           $DEPLOY_USER
    DATABASE_URL          postgres://<user>:<password>@127.0.0.1:5432/familyhub
    JWT_SECRET            $(head -c 32 /dev/urandom | base64 | tr '+/' '-_' | tr -d '=')
    APP_ORIGIN            https://$TS_HOST
    TS_OAUTH_CLIENT_ID    from https://login.tailscale.com/admin/settings/oauth
    TS_OAUTH_SECRET       from the same place

  Optional secrets (defaults in the workflow are used if unset)
    JWT_ISSUER            family-hub-auth
    JWT_AUDIENCE          family-hub-app
    JWT_ACCESS_TOKEN_TTL  15m
    REFRESH_TOKEN_TTL_DAYS 30
    APP_DIR               $APP_DIR
    APP_PORT              $APP_PORT

DEPLOY_SSH_KEY — copy everything between the BEGIN and END lines, inclusive:

$(cat "$KEY_PATH")

The DATABASE_URL password is yours to choose; the deploy derives the postgres
container's user, password and database name from that one URL. Note that
postgres keeps the credentials from first init, so changing the password later
means changing it in the running database too.

Also create an OAuth client at https://login.tailscale.com/admin/settings/oauth
with the "Keys > Auth Keys > Write" scope and the tag:ci tag. If Tailscale SSH
is enabled here (it intercepts port 22), the policy also needs an "ssh" rule and
this machine must carry a tag — see deploy/README.md. The action trades
those credentials for an ephemeral auth key, so auth_keys is the scope it needs
— not Devices. tag:ci has to exist in your policy file before the tag picker
will offer it, and it has to be allowed to reach this machine on port 22:

  "tagOwners": {
    "tag:ci": ["autogroup:owner"]
  },
  "hosts": {
    "$(hostname -s)": "$(tailscale ip -4 2>/dev/null || echo '<tailscale-ip>')"
  },
  "grants": [
    { "src": ["tag:ci"], "dst": ["$(hostname -s)"], "ip": ["tcp:22"] }
  ]

Then push to main.
EOF
