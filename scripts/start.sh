#!/usr/bin/env sh
# good-techstack — one-command bootstrap
# Usage: curl -fsSL <this script> | sh -s <app-name>
#
# Supported: macOS (Apple Silicon), Linux, Windows (via NixOS-WSL).
# Intel Macs are supported via upstream Nix installer.
# On Windows, run the Command Prompt block from README.md first, then this
# inside the NixOS-WSL terminal.
set -eu

REPO_OWNER="${REPO_OWNER:-eouzoe}"
APP_NAME="${1:-my-app}"

# 0. OS + arch detection (kept at the very top; no nix check here)
OS="$(uname -s 2>/dev/null || echo unknown)"
ARCH="$(uname -m 2>/dev/null || echo unknown)"
NIX_INSTALLER_UPSTREAM=0
case "$OS" in
  Linux*)
    # Native Linux and WSL (incl. NixOS-WSL) run the same flow below.
    # Windows users only reach this point after the README cmd block has
    # installed and opened NixOS-WSL, so no Windows-side detection is needed.
    ;;
  Darwin*)
    # macOS: Apple Silicon (arm64) uses the Determinate Nix installer.
    # Intel Macs (x86_64) use the official upstream installer since
    # Determinate Nix dropped x86_64-darwin support in v3.13.2 (Nov 2025).
    case "$ARCH" in
      arm64) ;;
      x86_64)
        echo "  -> Intel Mac detected: using upstream Nix installer"
        NIX_INSTALLER_UPSTREAM=1
        ;;
    esac
    ;;
esac

command -v curl >/dev/null 2>&1 || { echo "error: curl is required"; exit 1; }
command -v tar  >/dev/null 2>&1 || { echo "error: tar is required";  exit 1; }
command -v mktemp >/dev/null 2>&1 || { echo "error: mktemp is required"; exit 1; }

echo ""
echo "  good-techstack"
echo "  One command to start. A conversation to build."
echo ""

# 1-2. download good-techstack into a safe temp dir
GTS_TMP=$(mktemp -d /tmp/gts.XXXXXXXX) || { echo "error: failed to create temp dir"; exit 1; }
trap 'rm -rf "$GTS_TMP"' EXIT

echo "  -> Downloading good-techstack ..."
curl -fsSL "https://github.com/${REPO_OWNER}/good-techstack/archive/refs/heads/main.tar.gz" \
  -o "$GTS_TMP/repo.tar.gz"

mkdir -p "${APP_NAME}"
tar xzf "$GTS_TMP/repo.tar.gz" --strip-components=1 -C "${APP_NAME}"
cd "${APP_NAME}"

# 3. install Nix if missing. NixOS-WSL already has it.
#    Apple Silicon + Linux → Determinate Nix installer (handles macOS
#    APFS volume + launchd, Linux systemd, etc.). Intel Mac → upstream.
if ! command -v nix >/dev/null 2>&1; then
  echo "  -> Installing Nix ..."
  if [ "$NIX_INSTALLER_UPSTREAM" = "1" ]; then
    curl -fsSL https://nixos.org/nix/install | sh
  else
    curl -fsSL https://install.determinate.systems/nix | sh -s -- install --no-confirm \
      --extra-conf "max-substitution-jobs = 128" \
      --extra-conf "http-connections = 128"
  fi
  export PATH="$HOME/.nix-profile/bin:/nix/var/nix/profiles/default/bin:$PATH"
  if [ -e /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh ]; then
    . /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
  fi
fi

# 4. ensure devenv (idempotent — nix profile add is safe to re-run)
echo "  -> Installing devenv ..."
export PATH="$HOME/.nix-profile/bin:/nix/var/nix/profiles/default/bin:$PATH"
nix profile add nixpkgs#devenv

# 5. trust this project dir, then enter the devenv shell (interactive).
#    Everything else — bun deps, typecheck, secrets — is handled by
#    devenv tasks & just commands inside the shell.
echo "  -> Starting devenv shell ..."
devenv allow
devenv shell
echo "  Exited devenv shell. See you next time."
