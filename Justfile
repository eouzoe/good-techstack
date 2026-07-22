# good-techstack — common terminal operations
# Complements devenv tasks: agents use devenv's task runner, humans use just.

alias d := dev

# Start all dev servers (backend + frontend)
dev:
    devenv processes up

# Run oxlint
lint:
    bunx oxlint --type-aware

# TypeScript type check (runs `typecheck` script in every workspace via bun)
typecheck:
    bun --filter '*' typecheck

# Run tests (bun test — backend unit + shared package)
test:
    bun test

# Frontend tests (rstest — simulated deploy via Rsbuild build pipeline)
test-frontend:
    cd apps/frontend && bunx rstest

# Full test suite
test-all:
    devenv test

# Deploy to Cloudflare Workers
deploy:
    wrangler deploy

# Enter the dev environment
setup:
    devenv shell

# One-shot bootstrap (post-start.sh): verify env is ready
bootstrap:
    @command -v bun    >/dev/null 2>&1 && echo "  ✓ bun:      $(bun --version)"
    @bunx oxlint --version >/dev/null 2>&1 && echo "  ✓ oxlint:   $(bunx oxlint --version)"
    @command -v just   >/dev/null 2>&1 && echo "  ✓ just:     $(just --version)"
    @echo "  → Next: set your secrets and start your AI agent (see README.md)."

# Drizzle — push schema changes to the database
db-push:
    bunx drizzle-kit push

# Drizzle — generate SQL migration from schema changes
db-generate:
    bunx drizzle-kit generate

# SecretSpec audit log
audit:
    secretspec audit

# Run formatter
format:
    oxfmt --write .

# Clean build artefacts
clean:
    rm -rf dist/ build/ .next/ out/ .wrangler/ node_modules/
    bun install

# Update devenv lock (devenv.lock: nixpkgs + devenv modules)
update:
    devenv update

# Compare direct dependencies against latest npm versions
check-versions:
    bun scripts/check-versions.mjs

# Verify local toolchain matches lock file (Linux only)
check-env:
    bun scripts/check-env.mjs

# Start the AI agent non-interactively with the bootstrap prompt
# Auto-detects claude / codex / opencode, falls back to installing opencode.
# Does not pin the model — opencode uses its default provider.
agent:
    #!/usr/bin/env bash
    prompt="$(cat docs/agent/bootstrap-prompt.md)"
    export PATH="$PATH:$HOME/.claude/bin:$HOME/.local/bin:$(npm bin -g 2>/dev/null):$(pnpm bin -g 2>/dev/null):$HOME/.bun/bin:$HOME/.local/share/mise/shims:$HOME/.nix-profile/bin:/nix/profile/bin:/nix/var/nix/profiles/default/bin:/usr/local/bin:/opt/homebrew/bin:$HOME/.cargo/bin"
    if   command -v claude      >/dev/null 2>&1; then agent=claude
    elif command -v claude-code  >/dev/null 2>&1; then agent=claude
    elif command -v codex        >/dev/null 2>&1; then agent=codex
    elif command -v codex-cli    >/dev/null 2>&1; then agent=codex
    elif command -v opencode     >/dev/null 2>&1; then agent=opencode
    else
        agent=opencode
        echo "  -> Could not find any AI agent, installing opencode ..."
        nix profile add nixpkgs#opencode
    fi
    echo "  -> Starting $agent non-interactively with the bootstrap prompt ..."
    case "$agent" in
        claude)   claude -p "$prompt" ;;
        codex)    codex exec --full-auto "$prompt" ;;
        opencode) opencode run "$prompt" --auto ;;
    esac
