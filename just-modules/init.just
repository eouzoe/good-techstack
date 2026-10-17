# One-shot project initialisation (run after start.sh or clone)
init:
    @echo "  -> Type checking …"
    @devenv tasks run typecheck:app typecheck:worker
    @echo "  -> Checking secrets …"
    @secretspec check 2>/dev/null || echo "  (SecretSpec: set missing values with 'secretspec set <KEY>' — see docs/src/content/docs/en/reference/06-infra.md)"
    @echo ""
    @echo "  OK Template is ready. Run 'just dev' to start."

# Enter the dev environment
setup:
    devenv shell

# SecretSpec audit log
audit:
    secretspec audit
