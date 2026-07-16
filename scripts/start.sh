#!/usr/bin/env sh
# good-techstack — one-command bootstrap
# Usage: curl -fsSL <this script> | sh
#
# Supported: Windows (via NixOS-WSL) and Linux. macOS is not supported.
# On Windows, run the Command Prompt block from README.md first, then this
# inside the NixOS-WSL terminal. Native Linux works but is weakly supported.
set -eu

REPO_OWNER="${REPO_OWNER:-eouzoe}"
APP_NAME="${1:-my-app}"

# 0. OS detection (kept at the very top; no nix check here)
OS="$(uname -s 2>/dev/null || echo unknown)"
case "$OS" in
  Linux*)
    # Native Linux and WSL (incl. NixOS-WSL) run the same flow below.
    # Windows users only reach this point after the README cmd block has
    # installed and opened NixOS-WSL, so no Windows-side detection is needed.
    ;;
  Darwin*)
    echo "error: macOS is not supported yet."
    exit 1
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

# 3. install Nix if missing (official installer; no rootless detection — the
#    installer handles rootless/multi-user itself). NixOS-WSL already has it.
if ! command -v nix >/dev/null 2>&1; then
  echo "  -> Installing Nix ..."
  curl -fsSL https://install.nixos.org/nix-installer | sh -s -- install --no-confirm
  export PATH="$HOME/.nix-profile/bin:/nix/var/nix/profiles/default/bin:$PATH"
  if [ -e /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh ]; then
    . /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
  fi
fi

# 4. ensure devenv (idempotent — nix profile add is safe to re-run)
echo "  -> Installing devenv ..."
export PATH="$HOME/.nix-profile/bin:/nix/var/nix/profiles/default/bin:$PATH"
nix profile add nixpkgs#devenv

# 5. trust this project dir (devenv refuses untrusted dirs), then enter the
#    devenv shell and bootstrap — traced from here.
#    Trace 用 devenv 原生 --trace-to（pretty 到 stderr）。是否導出 OTLP 由
#    使用者自行決定（設 DEVENV_TRACE_TO / OTEL_EXPORTER_OTLP_ENDPOINT 即可），
#    這裡不硬塞 grpc 導出，只保證用最新 devenv 的 trace 機制、功能正常。
echo "  -> Bootstrapping environment (traced) ..."
devenv allow
devenv --trace-to pretty:stderr shell -- just bootstrap

echo ""
echo "  Done. Your environment is ready."
echo "  Now set your secrets and start your AI agent — see the boxed steps in README.md."
