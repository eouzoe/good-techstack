# Infrastructure: Cloudflare + Nix

> depends_on: []
> tags: [cloudflare, nix, infra, deployment, dev-environment]
> Last updated: 2026-07-10

## Cloudflare platform

### Development to deployment

```bash
bun run dev               # Local development
bunx rsbuild build        # Frontend build
bunx wrangler types       # Binding TS types
bunx wrangler deploy      # Deploy to Workers
```

### Services and free tier

| Service | Purpose | Free limit |
|---------|---------|------------|
| Workers | Backend execution (Hono + oRPC) | 100k requests/day |
| D1 | SQLite serverless | 5GB |
| R2 | Object storage | 10GB, zero egress fees |
| KV | Cache | 100k reads/day |
| Queues | Background tasks | 1M operations/month |
| DO | Strongly consistent state | 1M requests/month |
| Email | Email routing | 100/day |
| Turnstile | CAPTCHA | Free, unlimited |

### Vendor lock-in?

- Hono: Web Standards, runs anywhere
- D1: SQLite, dump → import
- R2: S3-compatible
- Drizzle: change DB with one line

### Cloudflare MCP servers

| Server | URL | Purpose |
|--------|-----|---------|
| API (Code Mode) | `https://mcp.cloudflare.com/mcp` | Full API, 2500+ endpoints |
| Documentation | `https://docs.mcp.cloudflare.com/mcp` | Product docs, semantic search |
| Workers Bindings | `https://bindings.mcp.cloudflare.com/mcp` | D1, R2, KV, AI, DO config |
| Workers Builds | `https://builds.mcp.cloudflare.com/mcp` | Build management |
| Observability | `https://observability.mcp.cloudflare.com/mcp` | Logs and analytics |

Authentication: Bearer Token (`~/.cloudflare/mcp-token`), never expires.

## Nix development environment

### `flake.nix` design boundary

**Bun manages JS dependency trees. Nix manages everything else.**

### Shell split

- `devShells.default`: Bun 1.3.14 + Node 22 + oxlint + oxfmt + workerd + wrangler
- `devShells.ci`: Node 22 + wrangler (sufficient for CI deploy)

### Before and after Nix

| Aspect | Before | After |
|--------|--------|-------|
| Environment consistency | README + good will, 30 minutes manual setup on new machine | `nix develop` one-command, versions locked |
| Dual runtime | Manually maintain two sets | default/ci, clean split |
| Toolchain drift | Versions out of sync | Everyone on the same version, flake.lock |
| Cache | Each person downloads separately | nix store shares binaries |

### CI usage

```yaml
- uses: cachix/install-nix-action@v27
- run: nix develop .#ci --command npx wrangler deploy
```

## Official docs

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare MCP: https://developers.cloudflare.com/agents/model-context-protocol/
- Nix flakes: https://nixos.wiki/wiki/Flakes
