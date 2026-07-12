# good-techstack — Agent Guide

This file is read by all AI agents (Claude Code, Codex, OpenCode).

## Project

good-techstack is an opinionated full-stack template for shipping products on Cloudflare Workers.

**Stack**: Bun + Hono + oRPC + Drizzle/D1 + better-auth + TanStack Start + oxlint/oxfmt

## Dev Environment

Managed by **devenv 2.x** + **flake.nix** (for build outputs only).

| Action        | Command                          |
| ------------- | -------------------------------- |
| Enter shell   | `devenv shell`                   |
| Start dev     | `devenv shell -- just dev`       |
| Run lint      | `devenv shell -- just lint`      |
| Run typecheck | `devenv shell -- just typecheck` |
| Run tests     | `devenv shell -- just test`      |

## Secrets

Managed by **SecretSpec** (v0.14.0). Read `secretspec.toml` for available keys.
Use `secretspec run -- <cmd>` to inject secrets into commands.

## Git Hooks

Pre-commit hooks run automatically: `oxlint` → `oxfmt` → `prettier`.
Failing hooks will block the commit.

## Docs to Read First

1. `docs/getting-started.md`
2. `docs/reference/design-decisions.md`
3. `docs/agent/scaffolding.md` (for new products)
