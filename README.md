> [📖 繁體中文版本（Traditional Chinese）](README.zh.md) — 如果您習慣閱讀中文，這裡有完整翻譯：產品介紹、安裝引導、AI 助手中文提示詞，以及繁體中文技術文件。請由此開始。

# good-techstack

One command. Your product on the edge.

---

## Quick start

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | sh
```

Apple Silicon and Intel both work. So does any Linux distro.

### Windows

Step 1 — **Command Prompt (Admin)**:

```cmd
curl -L -o %TEMP%\n.wsl "https://github.com/nix-community/NixOS-WSL/releases/latest/download/nixos.wsl" && wsl --install --from-file %TEMP%\n.wsl
```

Step 2 — Inside the NixOS-WSL terminal, run the same curl command as above.

---

After the shell is ready:

```bash
bun install
just init
just dev
```

Run `just agent` to hand over to an AI. It will detect your environment, install the agent if needed, and start the product discovery conversation — no manual setup required.

---

## Feed an AI directly (no installer)

Copy this block as the initial instruction for Claude Code, Codex, opencode, or any coding agent. The AI handles everything from here.

````markdown
You are setting up a good-techstack project. Detect your environment and work autonomously.

1. **Identify the OS** — run `uname -s` and `uname -m`. Match behaviour:
   - **macOS (arm64):** the install script uses Determinate Nix. After install, configure `extra-trusted-substituters` for speed.
   - **macOS (x86_64 / Intel):** upstream Nix installer. Same post-install optimisation.
   - **Linux (native):** Determinate Nix installer. Check for existing Nix first.
   - **WSL / NixOS-WSL:** Nix already installed. Skip Nix install, go straight to `devenv allow`.
   - **Other:** run `curl -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | sh` and handle errors.

2. **Ensure Nix is available.** If missing, run `sh scripts/start.sh`.

3. **Optimise the environment for the detected platform:**
   - macOS: add `extra-trusted-substituters = https://cache.nixos.org https://devenv.cachix.org` to nix config, restart nix-daemon.
   - NixOS / NixOS-WSL: ensure `nix.settings.substituters` includes cache URLs.
   - WSL: ensure sufficient memory in `/etc/wsl.conf` (recommended: 8 GB).

4. **Install the AI agent** (if not already present):
   - Prefer Claude Code: `nix profile add nixpkgs#claude-code`
   - Fallback Codex: `nix profile add nixpkgs#codex-cli`
   - Fallback opencode: `nix profile add nixpkgs#opencode`

5. **Handle authentication:**
   - Cloudflare API token: guide the user to create one at https://dash.cloudflare.com/profile/api-tokens (template: Workers:Edit). Save to `~/.cloudflare/mcp-token`.
   - If the agent needs its own API key, guide the user through signup.

6. **Initialise the project:** run `just init` inside `devenv shell` — generates D1 bindings, typechecks, seeds dev secrets.

7. **Read the bootstrap protocol:** open `docs/en/agent/bootstrap-prompt.md` and follow it step by step. Then read `docs/en/agent/scaffolding.md` for the product discovery protocol.

8. **Start the conversation:** run the 7-question product discovery with the user. Do not write code until the entity map is confirmed.
````

---

## What's in the box

| Layer          | What you get                                                |
| -------------- | ----------------------------------------------------------- |
| Runtime        | Bun — cold start in 1.2 ms                                  |
| API            | Hono + oRPC — contract-first, type-safe edge to DB          |
| Database       | D1 (SQLite) + Drizzle ORM — zero management                 |
| Auth           | better-auth — email, OAuth, SSO, sessions                   |
| Frontend       | TanStack Start — React, SSR, RSC                            |
| UI             | shadcn/ui — Tailwind CSS 4                                  |
| Linter         | oxlint — 840+ rules, 50× faster than ESLint                 |
| Formatter      | oxfmt — Rust-based, 30× faster than Prettier                |
| Infrastructure | Cloudflare Workers — D1, R2, KV, Queues, DO, Email          |
| Environment    | Nix + devenv 2.x — reproducible shells, one command         |

Everything is TypeScript. Everything is typed to the edge.

---

## Why this stack

**Zod 4 is the single source of truth.** One schema generates database types, API contracts, form validation, and auth config. No duplication, no drift:

```
packages/shared/ → Zod schema
  ├── Drizzle ORM:    z.infer<> → D1 row type
  ├── oRPC:           .input(UserCreate).output(UserResponse)
  ├── TanStack Form:  zodResolver(UserCreate)
  └── better-auth:    plugin config is also Zod
```

**Full-stack type safety.** `wrangler.toml` bindings, D1 queries, Hono routes, frontend components, environment variables — if it compiles, it works.

**Security by default.** SecretSpec replaces `.env` (secrets never committed). Dependency versions locked in `devenv.lock` + `bun.lock`. Workers sandbox isolates every request. better-auth handles hashing (Argon2id), sessions (JWT), CSRF, and OAuth.

---

## For developers

Full technical reference in `docs/en/`.

- [Getting started](docs/en/getting-started.md)
- [Development guide](docs/en/guide/development.md)
- [Deployment guide](docs/en/guide/deployment.md)
- [Testing guide](docs/en/guide/testing.md)
- [Reference docs](docs/en/reference/)
- [Design decisions](docs/en/reference/design-decisions.md)
- [Agent docs](docs/en/agent/)
- [Contribution areas](docs/en/guide/contribution-areas.md)

---

## Got stuck?

[Open an issue](https://github.com/eouzoe/good-techstack/issues/3) — tell us your system and what happened. No forms, no jargon.

---

Your idea, shipped. That is the point.
