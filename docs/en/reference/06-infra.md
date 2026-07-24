# Infrastructure: Cloudflare + Nix

> depends_on: []
> tags: [cloudflare, nix, infra, deployment, dev-environment]
> Last updated: 2026-07-10

## Cloudflare platform

### Development to deployment

```bash
devenv shell -- bun run dev        # Local development
devenv shell -- bunx rsbuild build   # Frontend build
devenv shell -- bunx wrangler types  # Binding TS types
devenv shell -- bunx wrangler deploy # Deploy to Workers
```

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
| Environment        | **devenv** (2.1.2+) | Shell activation, packages, toolchain pinning, processes, scripts, git hooks |
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

| Aspect            | Before (flake only)                    | After (devenv)                              |
| ----------------- | -------------------------------------- | ------------------------------------------- |
| Shell activation  | _Formerly_ `nix develop` (3.8s cached) | `devenv shell` (3.2s cached)                |
| Secret management | `.env` (no audit)                      | `secretspec.toml` (audit log, 11 providers) |
| Git hooks         | Manual `oxlint` on CI only             | Pre-commit blocks unformatted code          |
| Agent integration | None                                   | MCP server + commands auto-configured       |
| CI                | `nixbuild/nix-quick-install-action@v35` + `devenv tasks run` | 3 jobs across Linux/macOS/Windows |

### CI usage

```yaml
- uses: nixbuild/nix-quick-install-action@v35
- run: devenv shell -- bunx wrangler deploy
```

CI runs `devenv tasks run typecheck:backend typecheck:frontend` on three OSes (typecheck-linux, typecheck-macos, check-windows). Wrangler deploy is manual — no CI pipeline includes it.

## SecretSpec

Secrets are managed by **SecretSpec** instead of `.env` files.

```
secretspec.toml          # Key definitions (committed to git)
~/.config/secretspec/    # Encrypted values (local, never committed)
secretspec run -- <cmd>  # Inject secrets into a command
secretspec audit         # View access history
```

Supported providers: local keyring, dotenv, 1Password, Vault, AWS Secrets Manager, GCP Secret Manager.

### Migration

```bash
# Install
curl -fsSL https://secretspec.dev/install.sh | bash
secretspec init

# Set keys defined in secretspec.toml
secretspec secret set DATABASE_URL
secretspec secret set CLOUDFLARE_API_TOKEN

# Use
secretspec run -- devenv shell
```

Reference: https://secretspec.dev/quick-start/

## Official docs

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare MCP: https://developers.cloudflare.com/agents/model-context-protocol/
- Devenv: https://devenv.sh/reference/options/
- SecretSpec: https://secretspec.dev/quick-start/
