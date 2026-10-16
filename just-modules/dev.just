alias d := dev

# Start all dev servers (backend + frontend)
dev:
    devenv processes up

# Run oxlint (includes type-aware checking via config)
lint:
    bunx oxlint --type-aware

# TypeScript type check (tsc --noEmit)
typecheck:
    tsc --noEmit

# Run formatter
format:
    bunx oxfmt --write . "!**/*.gen.ts"
