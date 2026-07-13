# good-techstack — Claude Code Guide

This is a full-stack product template. You are Claude Code (the primary agent).

## Commands

- `devenv shell -- just dev` — start all dev servers
- `devenv shell -- just lint` — run oxlint
- `devenv shell -- just typecheck` — run tsc
- `devenv shell -- just test` — run tests
- `devenv shell -- just deploy` — deploy to Cloudflare

## MCP Servers

| Server                   | Purpose                           |
| ------------------------ | --------------------------------- |
| devenv                   | Query packages and options        |
| Cloudflare API           | Full API access (2500+ endpoints) |
| Cloudflare Bindings      | D1, R2, KV, AI, DO config         |
| Cloudflare Builds        | Build management                  |
| Cloudflare Observability | Logs and analytics                |

## Secret Management

Secrets use SecretSpec. Read `secretspec.toml` before accessing any secret. Use `secretspec run -- <cmd>` to inject secrets.

## First Steps

1. Read `docs/getting-started.md`
2. Read `docs/reference/design-decisions.md`
3. Read `docs/agent/scaffolding.md` if building a new product
