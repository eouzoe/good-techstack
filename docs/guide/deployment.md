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

The CI pipeline (GitHub Actions) runs:

1. `oxlint --type-aware`
2. `tsc --noEmit`
3. `bun test` (unit, contract, property)
4. `vitest run` (integration)

All must pass before merge.
