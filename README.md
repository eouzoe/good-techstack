> 完整中文說明在 [`README.zh.md`](README.zh.md)。請先閱讀中文指南以便了解詳細情況與步驟。

# good-techstack

Your product idea. One command. Shipped.

## Quick start

**Windows** — open **Command Prompt as Administrator** and run this once (downloads NixOS-WSL, ~550 MB, then opens it):

```cmd
curl -L -o %TEMP%\n.wsl "https://github.com/nix-community/NixOS-WSL/releases/latest/download/nixos.wsl" && wsl --install --from-file %TEMP%\n.wsl
```

Then, inside the NixOS-WSL terminal, run the command below.

**Linux / NixOS-WSL**:

```bash
curl -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | sh
```

> macOS is not supported. Native Linux works but is weakly supported — for the smoothest experience use NixOS-WSL on Windows or a NixOS machine.

---

You have an idea. You want to build it, put it out there, see if it works.

You do not want to spend weeks setting up infrastructure, choosing between authentication libraries, debugging configurations, or writing boilerplate for the fifth time.

This stack is for you.

---

## The gap between a prototype and a product

Vibe coding is fun. You describe something, an agent generates it, and it looks right in the browser.

Then you try to ship it.

There is no database. There is no login. There is nowhere to put it. The prototype was a single page, and now you need authentication, data persistence, error handling, deployment, a domain name — things no prototype ever thinks about.

Good-techstack fills that gap.

It gives you, from a single command:

- A backend that works and stays working
- A database that needs no management
- Authentication that works out of the box
- A frontend that loads fast everywhere
- Infrastructure that costs nothing until you have users
- An AI agent that understands every part of it

These are not optional extras. They are the difference between something that looks like a product and something that is one.

---

## For your AI agent

This is the part that changes how you build.

Most development stacks are designed for humans reading documentation. Good-techstack is designed for humans and their AI agents, equally.

Your agent reads the documentation — written for it, by design — and understands:

- **What tools exist**, and which ones to use. It will not suggest Prisma or Next.js or Redis. They are not in this stack.
- **What versions to install**. It checks before acting. It does not guess.
- **What patterns to follow**, and what to avoid. Every common mistake is catalogued with its alternative.
- **How to verify its own work**. A seven-layer test matrix must pass before any task is complete.

The result is an agent that ships working code. Every time. Not code that looks plausible and breaks at runtime.

When you tell your agent "add a login page", you get a login page — with sessions, token refresh, OAuth providers, CSRF protection — because the agent knows the auth library, has read its configuration, and follows the established patterns.

When you tell your agent "deploy", it deploys. The database is created. The environment is configured. The worker is live.

This is what happens when the agent understands the full stack.

---

## What you get

| What        | You get                                                      |
| ----------- | ------------------------------------------------------------ |
| Runtime     | Bun — fast enough that cold starts are not a thing           |
| API         | Hono + oRPC — type-safe from frontend to database            |
| Database    | D1 — SQLite at the edge, zero management                     |
| Auth        | better-auth — email, OAuth, SSO, all included                |
| Frontend    | TanStack Start — React, fast, type-safe                      |
| UI          | shadcn/ui — components that look good and work               |
| Linter      | oxlint — hundreds of rules, finishes before you notice       |
| Deployment  | Cloudflare Workers — free until you grow                     |
| Environment | Devenv 2.x + Nix — one command, identical setup for everyone |

All tested. All type-safe. All deployed to the edge.

---

## How it works

```
Your AI agent reads docs/ → understands the full stack

         TanStack Start (React + SSR + RSC)
         shadcn/ui · Tailwind · TypeScript

         Cloudflare Workers (Hono + oRPC)
         better-auth · Zod · Drizzle

    D1  │  R2  │  KV  │  Queues  │  DO  │  Email
```

You write your business logic. The stack handles the rest.

---

## Start

```bash
curl -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | sh
```

> **Windows:** run the Command Prompt block in [Quick start](#quick-start) first to install NixOS-WSL, then run the command above inside the NixOS-WSL terminal.

This one command does the heavy lifting:

1. Downloads good-techstack
2. Installs Nix if missing (NixOS-WSL already provides it)
3. Installs devenv — which auto-pulls `zsh` + `just` for you via libghostty
4. Bootstraps the development environment (traced from the first devenv call)

Then finish with the steps below — copy the whole block and run it:

```bash
# 1. Trust this project so `devenv shell` activates without prompts
devenv allow

# 2. SecretSpec — install the CLI once, then set every key from secretspec.toml
curl -fsSL https://secretspec.dev/install.sh | sh
devenv shell -- secretspec init
devenv shell -- secretspec secret set DATABASE_URL "postgres://..."
devenv shell -- secretspec secret set SESSION_SECRET "..."

# 3. Start your AI agent (Claude Code / Codex / OpenCode)
devenv shell -- claude --print "$(cat docs/agent/bootstrap-prompt.md)" .
# devenv shell -- codex  --prompt "$(cat docs/agent/bootstrap-prompt.md)" .
# devenv shell -- opencode --prompt "$(cat docs/agent/bootstrap-prompt.md)" .
```

(Optional) For auto-activation on `cd` into the project, add `eval "$(devenv hook zsh)"` to your `~/.zshrc` (or `bash`/`fish`/`nu`). devenv replaces direnv — no `.envrc` needed.

You only need two things: **a computer with internet** and **a product idea**.

---

## Got stuck?

Open an issue at [github.com/eouzoe/good-techstack/issues/3](https://github.com/eouzoe/good-techstack/issues/3) — tell us what system you are on and what happened. No jargon, no forms, just describe your situation.

---

## For developers

The full technical reference is in `docs/`. Start with `docs/getting-started.md`.

- [Guide](docs/guide/) — development, deployment, testing
- [Version checking](docs/guide/version-check.md) — how to check for outdated dependencies
- [Local environment check](docs/guide/env-check.md) — verify your machine matches the pinned versions (Linux)
- [Reference](docs/reference/) — per-layer deep dives (runtime, API, DB, auth, frontend, schema, infra, TypeScript)
- [Design decisions](docs/reference/design-decisions.md) — why we chose what we chose
- [Agent](docs/agent/) — AI agent rules, bootstrap, scaffolding, MCP reference
- [Contributing](CONTRIBUTING.md)
- [License](LICENSE)

---

This project does not aim to be the best stack, or the most complete, or the most elegant. It aims to be the stack that lets you start.

Your idea, shipped. That is the goal.

Everything else is configuration.
