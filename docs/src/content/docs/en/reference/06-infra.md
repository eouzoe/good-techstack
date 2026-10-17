---
title: 'Infrastructure: Cloudflare + Nix'
sidebar:
  order: 7
---

> depends_on: []
> tags: [cloudflare, nix, infra, deployment, dev-environment]
> Last updated: 2026-07-10

## Cloudflare platform

### Development to deployment

```bash
devenv shell -- bun run dev              # Local development (alchemy dev, binds from env)
devenv shell -- bunx alchemy deploy      # Deploy (alchemy runs the Vite build + applies D1 migrations)
```

The `alchemy.run.ts` file replaces `wrangler.jsonc` as the IaC layer: every
Cloudflare binding (D1, KV, DO, Rate Limit, and the auth config) is declared as
an `Effect` resource and passed to the Worker via `InferEnv`. There is no
standalone `vite build` script — builds happen inside `alchemy deploy`.

### Services and free tier

| Service   | Purpose                         | Free limit             |
| --------- | ------------------------------- | ---------------------- |
| Workers   | Backend execution (Hono + oRPC) | 100k requests/day      |
| D1        | SQLite serverless               | 5GB                    |
| R2        | Object storage                  | 10GB, zero egress fees |
| KV        | Cache                           | 100k reads/day         |
| Queues    | Background tasks                | 1M operations/month    |
| DO        | Strongly consistent state       | 1M requests/month      |
| Email     | Email routing                   | 100/day                |
| Turnstile | CAPTCHA                         | Free, unlimited        |

### State layering

A Worker is stateless: everything that outlives a request lives in a store,
and the store is picked by its consistency story, not by convenience.

| Store  | Consistency                   | Use                                         | Wired |
| ------ | ----------------------------- | ------------------------------------------- | ----- |
| D1     | Strong (single-region writes) | Business data, transactions, auth tables    | Yes   |
| KV     | Eventual (edge cache)         | Caches, feature flags, derived session data | Yes   |
| DO     | Strong, serialized per object | Coordination, live streams (`EventsDO`)     | Yes   |
| R2     | Strong durability             | Objects, static assets                      | No    |
| Queues | At-least-once                 | Background work, fan-out                    | No    |

`alchemy.run.ts` declares only the bindings the server code actually consumes;
R2 and Queues get added the day a feature consumes them — carrying a binding
with no consumer is drift, not readiness.

### Health checks

The Worker has no long-running process for a load balancer to probe, so the
template exposes an application-level probe:

```bash
curl -i https://<your-worker>/health
# HTTP/2 200
# {"checks":{"d1":"ok"},"status":"ok"}
```

`GET /health` runs `SELECT 1` through the same Drizzle → D1 path as production
queries: `200` while the binding answers, `503` with `"status":"degraded"` when
it does not. The devenv `dev` process uses it as its readiness probe, so
`devenv up` reports the app ready only after the Worker _and_ its D1 binding
answer. Platform-level routing health (edge availability, PoPs) never reaches
the Worker and stays Cloudflare's concern.

### Vendor lock-in?

- Hono: Web Standards, runs anywhere
- D1: SQLite, dump → import
- R2: S3-compatible
- Drizzle: change DB with one line

### Cloudflare MCP servers

| Server           | URL                                            | Purpose                       |
| ---------------- | ---------------------------------------------- | ----------------------------- |
| API (Code Mode)  | `https://mcp.cloudflare.com/mcp`               | Full API, 2500+ endpoints     |
| Documentation    | `https://docs.mcp.cloudflare.com/mcp`          | Product docs, semantic search |
| Workers Bindings | `https://bindings.mcp.cloudflare.com/mcp`      | D1, R2, KV, AI, DO config     |
| Workers Builds   | `https://builds.mcp.cloudflare.com/mcp`        | Build management              |
| Observability    | `https://observability.mcp.cloudflare.com/mcp` | Logs and analytics            |

Authentication: Bearer Token (`~/.cloudflare/mcp-token`), never expires.

## Nix development environment

### Management split

| Layer              | Tool                | Scope                                                                        |
| ------------------ | ------------------- | ---------------------------------------------------------------------------- |
| Environment        | **devenv** (2.2.1+) | Shell activation, packages, toolchain pinning, processes, scripts, git hooks |
| JS dependency tree | **Bun**             | `node_modules`, `bun.lock`                                                   |

devenv is the single source of truth: `devenv.nix` declares the toolchain and
`devenv.lock` pins the exact `nixpkgs` commit those tools come from. There is no
separate flake — toolchain versions live entirely in `devenv.lock`.

### devenv features

| Feature           | Config                     | Purpose                                                    |
| ----------------- | -------------------------- | ---------------------------------------------------------- |
| Packages          | `packages` in `devenv.nix` | bun, node, oxlint, oxfmt, wrangler, typescript, ts-ls      |
| Processes         | `processes`                | `devenv process up` runs backend + frontend                |
| Scripts           | `scripts`                  | `lint`, `typecheck`, `test` via `devenv shell -- <script>` |
| Pre-commit hooks  | `git-hooks.hooks`          | oxlint + oxfmt + prettier run on every `git commit`        |
| Secret management | `secretspec.enable`        | SecretSpec replaces `.env` completely                      |
| Agent MCP         | `claude.code.mcpServers`   | Agent queries devenv packages/options                      |
| Agent commands    | `claude.code.commands`     | Agent runs devenv scripts directly                         |

### Before and after devenv

| Aspect            | Before (flake only)                                          | After (devenv)                                      |
| ----------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| Shell activation  | _Formerly_ `nix develop` (3.8s cached)                       | `devenv shell` (3.2s cached)                        |
| Secret management | `.env` (no audit)                                            | `secretspec.toml` (audit log, 23 providers, scopes) |
| Git hooks         | Manual `oxlint` on CI only                                   | Pre-commit blocks unformatted code                  |
| Agent integration | None                                                         | MCP server + commands auto-configured               |
| CI                | `nixbuild/nix-quick-install-action@v35` + `devenv tasks run` | 3 jobs across Linux/macOS/Windows                   |

### CI usage

```yaml
- uses: nixbuild/nix-quick-install-action@v35
- run: devenv shell -- secretspec run --scope deploy -- bunx alchemy deploy
```

CI runs `devenv tasks run typecheck:app typecheck:worker` on three OSes (typecheck-linux, typecheck-macos, check-windows). Alchemy deploy is manual — no CI pipeline includes it.

## SecretSpec

Secrets are managed by **SecretSpec** instead of `.env` files.

```
secretspec.toml          # Declarations (committed to git; values live in the provider)
.env                     # Default dev provider (dotenv, gitignored)
secretspec run --scope runtime -- <cmd>  # Inject a scoped subset into a command
secretspec check         # Resolve/generate missing secrets (BETTER_AUTH_SECRET is auto-generated)
secretspec audit         # View access history (on by default, local JSONL)
```

alchemy reads its `Config` bindings (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`USE_MOCKS`) from the process environment at dev/deploy time, so scope
injection via `secretspec run` is the wiring path — there is no CF Vite plugin
anymore.

Providers: keyring, dotenv, env, 1Password, Vault/OpenBao, age, SOPS, AWS/GCP/Azure secret managers, and more (23 total in 0.17).

### Scopes (SecretSpec 0.17+)

`[scopes.runtime]` and `[scopes.deploy]` give each process only the secrets it needs:

```bash
secretspec run --scope runtime -- bun run dev      # BETTER_AUTH_*
secretspec run --scope deploy -- bunx alchemy deploy   # CLOUDFLARE_* + BETTER_AUTH_*
```

`run --scope` also strips non-scope secrets from the child environment.

### Migration

```bash
# Install (only needed outside a devenv shell — devenv 2.2+ bundles the CLI)
curl -fsSL https://secretspec.dev/install.sh | bash

# Set keys defined in secretspec.toml
secretspec set CLOUDFLARE_API_TOKEN
secretspec set CLOUDFLARE_ACCOUNT_ID

# Use
secretspec run --scope runtime -- devenv shell
```

Reference: https://secretspec.dev/quick-start/

## Official docs

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare MCP: https://developers.cloudflare.com/agents/model-context-protocol/
- Devenv: https://devenv.sh/reference/options/
- SecretSpec: https://secretspec.dev/quick-start/
