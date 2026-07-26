# One-shot project initialisation (run after start.sh or clone)
init:
    @echo "  -> Initialising secrets …"
    @secretspec init 2>/dev/null; ret=$$?; \
        if [ "$$ret" -eq 0 ]; then \
            echo "  OK Template is ready."; \
        fi

# Enter the dev environment
setup:
    devenv shell

# SecretSpec audit log
audit:
    secretspec audit
