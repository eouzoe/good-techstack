alias d := dev

# Start all dev servers (backend + frontend)
dev:
    devenv processes up

# Run lint + type check (config in .oxlintrc.json)
lint:
    bunx oxlint

# Run formatter
format:
    oxfmt --write .
