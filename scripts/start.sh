#!/usr/bin/env sh
# good-techstack — one-command bootstrap
# Usage: curl -sSfL <this script> | sh
set -eu

REPO_OWNER="${REPO_OWNER:-eouzoe}"
APP_NAME="${1:-my-app}"

# 0. prerequisites
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

# 3. install Nix (official installer; non-interactive pipe form)
if ! command -v nix >/dev/null 2>&1; then
  echo "  -> Installing Nix (this may prompt for your password) ..."
  curl -sSfL https://artifacts.nixos.org/nix-installer | sh -s -- install
  export PATH="$HOME/.nix-profile/bin:/nix/var/nix/profiles/default/bin:$PATH"
  if [ -e /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh ]; then
    . /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
  fi
fi

# 4. early-install devenv (it auto-pulls zsh + just via devenv.nix;
#    libghostty wires up the zsh shell integration — no manual hook needed)
echo "  -> Installing devenv ..."
nix profile add nixpkgs#devenv

# ensure the nix profile bin (where `devenv` now lives) is on PATH,
# whether nix was just installed above or already present
export PATH="$HOME/.nix-profile/bin:/nix/var/nix/profiles/default/bin:$PATH"

# 5. trust this project dir (devenv refuses untrusted dirs), then enter the
#    devenv shell (zsh via libghostty) and bootstrap — traced from here
echo "  -> Bootstrapping environment (traced) ..."
devenv allow
devenv --trace-to pretty:stderr shell -- just bootstrap

echo ""
echo "  Done. Your environment is ready."
echo "  Now set your secrets and start your AI agent — see the boxed steps in README.md."
