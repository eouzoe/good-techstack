# Deployment

How to deploy to Cloudflare Workers.

---

## Prerequisites

- [ ] `wrangler.toml` is configured with the correct `account_id`
- [ ] `~/.cloudflare/mcp-token` exists and is valid
- [ ] D1 database is created (`wrangler d1 create <name>`)

## Steps

### 1. Generate binding types

```bash
devenv shell -- bunx wrangler types
```

### 2. Type check

```bash
just typecheck        # devenv shell -- tsc --noEmit
```

### 3. Lint

```bash
just lint              # devenv shell -- oxlint --type-aware
```

### 4. Run integration tests

```bash
devenv shell -- vitest run
```

### 5. Deploy

```bash
just deploy             # devenv shell -- bunx wrangler deploy
```

### 6. Verify production

```bash
devenv shell -- bunx wrangler tail
```

Use Cloudflare Observability MCP to check error rate and latency after deployment.

## CI/CD

CI runs `devenv tasks run typecheck:backend typecheck:frontend` on three OSes. Lint, test, and vitest are run locally before push but are not part of the CI pipeline.
