# Getting Started

Good-techstack is an opinionated full-stack template for shipping products fast. It runs on Cloudflare Workers, uses Bun for development, and ships with an AI agent that understands the entire stack.

---

## Quick Start

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | sh
```

This downloads the stack and an AI agent, then guides you through setup, product discovery, code generation, and deployment.

---

## Reading Guide

| If you want to...                                | Start here                            |
| ------------------------------------------------ | ------------------------------------- |
| Understand the architecture and tech choices     | `reference/design-decisions.md`       |
| Set up your local development environment        | `guide/development.md`                |
| Deploy to production                             | `guide/deployment.md`                 |
| Write and run tests                              | `guide/testing.md`                    |
| Understand a specific layer (Bun, API, DB, etc.) | `reference/` (pick the relevant file) |
| Set up the AI agent                              | `agent/rules.md`                      |
| Scaffold a new feature                           | `agent/scaffolding.md`                |
| Contribute to the project                        | `contributing.md`                     |

---

## Directory Layout

```
docs/
  getting-started.md        ← you are here
  guide/                    ← how-to guides for common tasks
    development.md
    deployment.md
    testing.md
  reference/                ← technical reference per layer
    runtime.md              ← Bun
    api.md                  ← Hono + oRPC
    database.md             ← Drizzle + D1
    auth.md                 ← better-auth
    frontend.md             ← TanStack Start
    schema.md               ← Zod
    infrastructure.md       ← Cloudflare + Nix
    typescript.md           ← TypeScript patterns
    design-decisions.md     ← why we chose what we chose
  agent/                    ← AI agent configuration and protocols
    rules.md
    bootstrap-prompt.md
    scaffolding.md
    mcp-reference.md
  contributing.md
  CHANGELOG/
```

---

## The Stack

| Layer          | Technology                |
| -------------- | ------------------------- |
| Runtime        | Bun                       |
| API            | Hono + oRPC               |
| Database       | D1 (SQLite) + Drizzle ORM |
| Auth           | better-auth               |
| Frontend       | TanStack Start (React)    |
| UI             | shadcn/ui                 |
| Schemas        | Zod                       |
| Linting        | oxlint                    |
| Infrastructure | Cloudflare Workers        |
| Environment    | Nix                       |

All type-safe. All tested. All deployed to the edge.
