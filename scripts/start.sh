#!/usr/bin/env bash
# good-techstack — from zero to a running AI agent that builds your product
# Security flags follow rustup conventions (--proto '=https' --tlsv1.2)
# Usage:
#   curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | bash
set -euo pipefail

REPO_OWNER="${REPO_OWNER:-user}"
APP_NAME="${1:-my-app}"

echo ""
echo "  good-techstack"
echo "  One command to start. A conversation to build."
echo ""

# ── Prerequisites ──
command -v curl >/dev/null 2>&1 || { echo "  curl is required"; exit 1; }
command -v tar  >/dev/null 2>&1 || { echo "  tar is required";  exit 1; }

# ── Download good-techstack ──
echo "  → Downloading good-techstack..."
curl -fsSL "https://github.com/$REPO_OWNER/good-techstack/archive/main.tar.gz" | tar xz
mv good-techstack-main "$APP_NAME"
cd "$APP_NAME"

# ── Install Nix (background) ──
if ! command -v nix &>/dev/null; then
  echo "  → Installing Nix (background)..."
  curl -fsSL https://install.determinate.systems/nix | sh -s -- install --no-confirm &
  NIX_PID=$!
fi

# ── AI agent ──
detect_agent() {
  if command -v claude &>/dev/null; then echo "claude"; return 0; fi
  if command -v opencode &>/dev/null; then echo "opencode"; return 0; fi
  if command -v codex &>/dev/null; then echo "codex"; return 0; fi
  if command -v cursor &>/dev/null; then echo "cursor"; return 0; fi
  echo ""
}

start_agent() {
  local prompt_file="docs/config/agent-bootstrap-prompt.md"
  local prompt
  prompt=$(cat "$prompt_file")

  case "$1" in
    claude)   exec claude --print "$prompt" . ;;
    opencode) exec opencode --prompt "$prompt" . ;;
    codex)    exec codex --prompt "$prompt" . ;;
    cursor)   echo "  → Open $APP_NAME in Cursor manually."
              echo "    Cursor will read the bootstrap prompt automatically."
              echo "    cd $APP_NAME && cursor ."
              exit 0 ;;
  esac
}

AGENT=$(detect_agent)

if [ -z "$AGENT" ]; then
  echo ""
  echo "  No AI agent detected."
  echo "  good-techstack needs one to build your product."
  echo ""
  echo "  Options:"
  echo "    1) opencode   — free, works immediately, select any model"
  echo "    2) claude     — Claude Code by Anthropic"
  echo "    3) codex      — OpenAI Codex CLI"
  echo "    4) cursor     — Cursor editor (open manually)"
  echo ""
  echo -n "  Which one? [1/2/3/4] (default: 1): "
  read -r choice
  choice="${choice:-1}"

  case "$choice" in
    2) echo "  → Install Claude Code: https://docs.anthropic.com/en/docs/claude-code" ;;
    3) echo "  → Install Codex CLI: https://github.com/openai/codex" ;;
    4) echo "  → Install Cursor: https://cursor.com" ;;
    *)
      echo "  → Installing opencode..."
      curl -fsSL https://opencode.ai/install | bash -s -- --no-modify-path
      export PATH="$HOME/.opencode/bin:$PATH"
      AGENT="opencode"
      echo "  → Installed. Starting..."
      start_agent "$AGENT"
      ;;
  esac
  echo "  → Run the script again after installing."
  exit 0
fi

# ── Wait for Nix (background) ──
if [ -n "${NIX_PID:-}" ]; then
  echo "  → Waiting for Nix..."
  wait "$NIX_PID" 2>/dev/null || true
  . /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh 2>/dev/null || true
fi

# ── Start agent ──
echo ""
echo "  good-techstack is ready."
echo "  Starting $AGENT..."
echo ""
start_agent "$AGENT"
