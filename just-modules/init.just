# One-shot project initialisation (run after start.sh or clone)
init:
    @echo "  -> Generating D1 type bindings …"
    @devenv tasks run deps:gen-types 2>/dev/null || true
    @echo "  -> Linting & type checking …"
    @devenv tasks run deps:lint
    @echo "  -> Initialising secrets …"
    @secretspec init 2>/dev/null; ret=$$?; \
        if [ "$$ret" -eq 0 ]; then \
            echo "  -> Setting default dev secrets …"; \
            BETTER_AUTH_SECRET=$$(openssl rand -hex 32 2>/dev/null || echo "local-dev-secret-change-me"); \
            secretspec secret set BETTER_AUTH_SECRET "$$BETTER_AUTH_SECRET" 2>/dev/null; \
            secretspec secret set BETTER_AUTH_URL "http://localhost:3000" 2>/dev/null; \
        fi
    @echo ""
    @echo "  OK Template is ready. Run 'just dev' to start."

# Enter the dev environment
setup:
    devenv shell

# Compare direct dependencies against latest npm versions
check-versions:
    bun scripts/check-versions.mjs

# Verify local toolchain matches lock file (Linux only)
check-env:
    bun scripts/check-env.mjs

# SecretSpec audit log
audit:
    secretspec audit
