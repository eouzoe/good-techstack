# Run tests (bun test — backend unit + shared package)
test:
    bun test

# Frontend tests (rstest — simulated deploy via Rsbuild build pipeline)
test-frontend:
    cd apps/frontend && bunx rstest

# Full test suite
test-all:
    devenv test
