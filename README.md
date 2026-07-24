> [繁體中文版本](README.zh.md)

# good-techstack

One command. A conversation to build. Your product on the edge.

---

## Quick start

```bash
curl -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | sh
```

<sub>**Windows:** open **Command Prompt as Administrator** and run this first (installs NixOS-WSL, ~550 MB):</sub>

```cmd
curl -L -o %TEMP%\n.wsl "https://github.com/nix-community/NixOS-WSL/releases/latest/download/nixos.wsl" && wsl --install --from-file %TEMP%\n.wsl
```

<sub>Then run the curl command above inside the NixOS-WSL terminal.</sub>
<sub>**Intel Mac:** the script detects your architecture and uses the upstream Nix installer automatically.</sub>

That one command downloads the stack, installs Nix + devenv, and opens an interactive shell. From there, hand over to your AI agent — or keep going yourself.

---

## For your AI agent

Copy this block and paste it as the initial instruction for Claude Code, Codex, opencode, or any AI coding agent:

````markdown
You are setting up a good-techstack project. Detect your environment and work autonomously.

1. **Identify the OS** — run `uname -s` and `uname -m`. Match the behaviour:
   - **macOS (arm64):** the install script uses Determinate Nix. After install, configure `extra-trusted-substituters` for speed.
   - **macOS (x86_64 / Intel):** the install script uses the upstream Nix installer. Same post-install optimisation.
   - **Linux (native):** Determinate Nix installer. Check for existing Nix first.
   - **WSL / NixOS-WSL:** Nix is already installed. Skip Nix install, go straight to `devenv allow`.
   - **Other:** run `curl -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | sh` and handle errors.

2. **Ensure Nix is available.** If missing, run the start script with `sh scripts/start.sh`.

3. **Optimise the environment for your platform:**
   - macOS: add `extra-trusted-substituters = https://cache.nixos.org https://devenv.cachix.org` to `/etc/nix/nix.conf` (or `~/.config/nix/nix.conf`), then `sudo launchctl stop org.nixos.nix-daemon && sudo launchctl start org.nixos.nix-daemon`.
   - NixOS / NixOS-WSL: ensure `nix.settings.substituters` includes cache URLs for faster downloads.
   - Windows WSL: ensure `/etc/wsl.conf` has `[wsl2] kernelSettings=true` and sufficient memory (recommended: 8 GB).

4. **Install the AI agent** (if not already present):
   - Prefer Claude Code: `nix profile add nixpkgs#claude-code` or `npm i -g @anthropic-ai/claude-code`
   - Fallback Codex: `nix profile add nixpkgs#codex-cli`
   - Fallback opencode: `nix profile add nixpkgs#opencode`
   - If none available, install opencode (smallest footprint).

5. **Handle authentication:**
   - Cloudflare API token: guide the user to create one at https://dash.cloudflare.com/profile/api-tokens (template: Workers:Edit). Save to `~/.cloudflare/mcp-token`.
   - If the AI agent needs its own API key, guide the user through signup.

6. **Initialise the project:** run `just init` inside `devenv shell`. This generates D1 type bindings, runs type checking, and sets up local dev secrets.

7. **Read the bootstrap protocol:** open `docs/en/agent/bootstrap-prompt.md` and follow it step by step. Then read `docs/en/agent/scaffolding.md` for the product discovery protocol.

8. **Start the conversation:** begin the 7-question product discovery with the user. Do not write code until the entity map is confirmed.
````

Paste that into your chat with any AI coding agent. The agent will detect your OS, install dependencies, configure optimisations, and start building — you only answer questions about your product idea.

---

## What makes this different

### The Zod 4 chain — from database to browser

A single Zod schema generates your database types, API contracts, form validation, and auth config. No duplication. No drift. One source of truth runs through every layer:

```
packages/shared/ → Zod schema (single source of truth)
  ├── Drizzle ORM:  z.infer<> maps to D1 row types
  ├── oRPC:         .input(UserCreate).output(UserResponse)
  ├── TanStack Form: zodResolver(UserCreate)
  └── better-auth:   plugin config is also Zod
```

### Full-stack TypeScript, not just your code

The entire pipeline is typed — `wrangler.toml` bindings, D1 queries, Hono routes, oRPC contracts, frontend components, environment variables. If it compiles, it works. No runtime surprises from mismatched types.

### Developer experience that scales

|        | What it means                                      |
| ------ | -------------------------------------------------- |
| **DX** | Bun cold starts in 1.2 ms. oxlint runs 50× faster than ESLint. `just dev` starts both servers. Changes reflect instantly. |
| **AX** | Your AI agent reads documentation written for it, not you. It knows exactly which tools to use, which versions to install, and which patterns to follow. It verifies every step before continuing. |
| **Setup** | One command. No Homebrew, no asdf, no Docker. Nix + devenv gives everyone the same environment. |

### Supply chain, locked

- `devenv.lock` pins the exact nixpkgs commit (toolchain hashes)
- `bun.lock` pins every JavaScript dependency
- Cloudflare Workers sandbox isolates your runtime

---

## What you get

| What        | You get                                                      |
| ----------- | ------------------------------------------------------------ |
| Runtime     | Bun — fast enough that cold starts disappear                 |
| API         | Hono + oRPC — type-safe edge to database                     |
| Database    | D1 — SQLite at the edge, zero management                     |
| Auth        | better-auth — email, OAuth, SSO, ready to use                |
| Frontend    | TanStack Start — React, SSR, RSC, fast everywhere            |
| UI          | shadcn/ui — components that look good out of the box         |
| Linter      | oxlint — hundreds of rules, finishes before you notice       |
| Deployment  | Cloudflare Workers — free until you grow                     |
| Environment | Devenv 2.x + Nix — one command, identical setup for everyone |

All typed. All tested. All deployed to the edge.

---

## How it works

```
Your AI agent reads docs/en/ → understands the full stack

         TanStack Start (React + SSR + RSC)
         shadcn/ui · Tailwind · TypeScript

         Cloudflare Workers (Hono + oRPC)
         better-auth · Zod · Drizzle

    D1  │  R2  │  KV  │  Queues  │  DO  │  Email
```

You own your business logic. The stack owns the plumbing.

---

## Detailed setup

The quick-start command does everything in one pass. Here is what happens:

1. Downloads the latest good-techstack into `./my-app/`
2. Installs **Nix** if missing (Determinate Nix on Apple Silicon + Linux, upstream on Intel Mac, skipped on NixOS-WSL)
3. Installs **devenv** via `nix profile add`
4. Trusts the project directory (`devenv allow`)
5. Enters `devenv shell` — interactive, with `bun`, `node`, `oxlint`, `oxfmt`, `wrangler`, `just`, `typescript` all available

From inside the shell:

```bash
bun install               # Install JavaScript dependencies
just init                 # Generate bindings, typecheck, seed secrets
just dev                  # Start backend + frontend dev servers
```

Continue with your AI agent (paste the prompt above), or explore the documentation at `docs/en/`.

---

## For developers

The full technical reference is in `docs/en/`.

- [Getting started](docs/en/getting-started.md)
- [Development guide](docs/en/guide/development.md)
- [Deployment guide](docs/en/guide/deployment.md)
- [Testing guide](docs/en/guide/testing.md)
- [Reference docs](docs/en/reference/) — per-layer deep dives
- [Design decisions](docs/en/reference/design-decisions.md)
- [Agent docs](docs/en/agent/) — rules, bootstrap, scaffolding
- [Contribution areas](docs/en/guide/contribution-areas.md)

---

## Got stuck?

Open an issue at [github.com/eouzoe/good-techstack/issues/3](https://github.com/eouzoe/good-techstack/issues/3) — tell us your system and what happened. No jargon, no forms, just describe the situation.

---

Your idea, shipped. That is the point.
