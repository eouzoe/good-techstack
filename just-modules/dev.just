alias d := dev

# Start all dev servers (backend + frontend)
dev:
    devenv processes up

# Run oxlint
lint:
    bunx oxlint --type-aware

# TypeScript type check
typecheck:
    bun --filter '*' typecheck

# Run formatter
format:
    oxfmt --write .
