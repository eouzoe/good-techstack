# Getting Started

Good-techstack is an opinionated full-stack template for shipping products on Cloudflare Workers.

---

## Quick Start

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | sh
```

This installs Nix + devenv, enters the development shell, and runs `bun install`.

---

## Reading Guide

| If you want to...                                | Start here                                  |
| ------------------------------------------------ | ------------------------------------------- |
| Understand the architecture and tech choices     | `en/reference/design-decisions.md`          |
| Set up your local development environment        | `en/guide/development.md`                   |
| Deploy to production                             | `en/guide/deployment.md`                    |
| Write and run tests                              | `en/guide/testing.md`                       |
| Understand a specific layer (Bun, API, DB, etc.) | `en/reference/` (pick the relevant file)    |
| Set up the AI agent                              | `en/agent/rules.md`                         |
| Scaffold a new feature                           | `en/agent/scaffolding.md`                   |
| Contribute to the project                        | `en/guide/contribution-areas.md`            |

---

## Directory Layout

```
docs/
  getting-started.md          ← you are here
  en/                         ← English documentation
    guide/                    ← how-to guides
    reference/                ← technical reference per layer
    agent/                    ← AI agent configuration
  zh-Hant/                    ← Traditional Chinese documentation
    guide/
    reference/
    agent/
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
| Environment    | Nix + devenv              |
