alias d := dev

# Start all dev processes (router watcher + alchemy dev + Drizzle Studio)
dev:
    cd init-playground && devenv processes up

# Run oxlint (includes type-aware checking via config)
lint:
    bunx oxlint --type-aware

# Type-check the app and the worker (devenv tasks)
typecheck:
    devenv tasks run typecheck:app typecheck:worker

# Run formatter
format:
    bunx oxfmt --write . "!**/*.gen.ts"
