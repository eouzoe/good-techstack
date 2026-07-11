#!/usr/bin/env bash
# good-techstack — set up the development environment (run this after obtaining the source code)
# Usage: ./bootstrap.sh
set -euo pipefail

cd "$(dirname "$0")"

# ── Nix ──
if ! command -v nix &>/dev/null; then
  echo "→ Installing Nix..."
  curl -fsSL https://install.determinate.systems/nix | sh -s -- install --no-confirm
  . /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
fi

# ── Toolchain + JS dependencies ──
echo "→ Installing toolchain and JS dependencies..."
nix develop --command bash <<'SCRIPT'
  echo "  bun:      $(bun --version)"
  echo "  node:     $(node --version)"
  echo "  oxlint:   $(oxlint --version 2>/dev/null || echo N/A)"
  cd apps/backend
  bun install
SCRIPT

# ── Cloudflare token ──
if [ ! -f "$HOME/.cloudflare/mcp-token" ]; then
  echo ""
  echo "╔══════════════════════════════════════╗"
  echo "║  Cloudflare API Token not set         ║"
  echo "║  https://dash.cloudflare.com/profile/api-tokens  ║"
  echo "║  Needs Workers:Edit permission         ║"
  echo "║  Save to ~/.cloudflare/mcp-token       ║"
  echo "╚══════════════════════════════════════╝"
  echo ""
fi

echo "✅ good-techstack ready"
echo "   cd apps/backend && bun run dev"
