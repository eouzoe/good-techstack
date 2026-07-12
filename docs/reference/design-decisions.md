# Design Decisions

Why we chose what we chose, what we avoid, and the principles that guide both.

---

## Principles

### 1. Zod is the single source of truth for schemas

Zod schemas live in `packages/contract/`. oRPC input/output, Drizzle DB types, TanStack Form validation, and better-auth plugin config all derive from Zod.

Do not introduce a second schema language (TypeBox, Valibot, ArkType, etc.).

### 2. Bun first, Node only in CI

Daily development uses Bun. Node.js is used only in CI (Cloudflare officially supports only Node.js). The `check` CI job installs Bun via `oven-sh/setup-bun` directly; the `devenv-test` job runs the full devenv environment. `flake.nix` now only defines buildable `packages` outputs.

### 3. Cloudflare native, do not bypass

Use Workers runtime bindings (D1, R2, KV, Queues, DO) directly. No abstraction layer. Test with `@cloudflare/vitest-pool-workers` on real workerd. No mocks.

### 4. Type safety is not optional

Every API route must have an oRPC contract. Every database query must go through Drizzle ORM. Every form must have a Zod resolver. `tsconfig.json` uses strict mode with `noUncheckedIndexedAccess`.

### 5. Web Standards = portability

Hono uses Web Standards API (`Request`, `Response`, `fetch`, `URL`). Shared logic must not depend on Bun-only APIs unless explicitly marked. The same code behaves identically in Bun (development) and Workers (production).

### 6. Documentation is the harness

Every technical decision is recorded. An agent reads the relevant documentation before changing code, and updates it after. Version data lives in `versions.toml` as the single source of truth.

### 7. Simplicity over everything

No unnecessary abstraction layers. No unnecessary dependencies (Turborepo, Nx: not needed. Bun workspace suffices). No premature optimisation.

### 8. Supply chain awareness

Nix flakes lock toolchain versions and hashes. Bun lockfile locks JavaScript dependencies. Every test layer locks behavioural correctness.

---

## Key Decisions

| Decision       | Choice                 | Rejected                       |
| -------------- | ---------------------- | ------------------------------ |
| Runtime        | Bun (dev) + Node (CI)  | Node-only, Deno                |
| HTTP framework | Hono                   | Express, Fastify, Elysia       |
| RPC            | oRPC (contract-first)  | tRPC, Hono RPC                 |
| ORM            | Drizzle                | Prisma, Kysely                 |
| Auth           | better-auth            | Lucia, Auth.js                 |
| Schema         | Zod                    | Valibot, ArkType, TypeBox      |
| Linter         | oxlint                 | ESLint, Biome                  |
| Formatter      | oxfmt                  | Prettier, Biome                |
| Bundler        | Rsbuild 2 (Rspack 2)   | Vite, Webpack                  |
| CSS            | Tailwind CSS 4         | Vanilla CSS, CSS modules       |
| Components     | shadcn/ui (Base UI)    | Radix, MUI                     |
| Deployment     | Cloudflare Workers     | Vercel, Railway, Fly           |
| Environment    | Devenv 2.x + flake.nix | Docker, asdf, mise, flake-only |
| Monorepo       | Bun workspace          | Turborepo, Nx, pnpm workspaces |

---

## What Not to Do

| Don't                                 | Why                                     | Do instead                          |
| ------------------------------------- | --------------------------------------- | ----------------------------------- |
| Add Prisma                            | ~5MB bundle, Workers support is beta    | Drizzle ORM (10KB, D1-native)       |
| Add ESLint, Prettier, or Biome        | oxlint is 50-100x faster                | oxlint + oxfmt                      |
| Add Turborepo, Nx, or pnpm workspaces | Bun workspace is fast enough            | Bun workspace                       |
| Add Redis or BullMQ                   | Workers has no Redis                    | KV + Queues + DO                    |
| Use raw SQL (except edge cases)       | Bypasses type-safe chain                | Drizzle query builder               |
| Use `process.env`                     | Workers use `env.XXX`                   | Hono `c.env.XXX`                    |
| Use `.env` files                      | No audit, no provider flexibility       | SecretSpec (`secretspec.toml`)      |
| Use `make` or `task` for task running | Make is verbose, Task is another Go dep | Justfile (single binary, zero deps) |
| Add Express or Fastify                | Not Web Standards                       | Hono                                |
| Introduce a second schema library     | Breaks Zod single-source-of-truth       | Zod only                            |
| Add tRPC                              | oRPC has broader type safety            | oRPC                                |
| Use npm, pnpm, or yarn                | Bun is the default                      | `bun add`                           |
| Write API tokens into code or commits | Security vulnerability                  | `~/.cloudflare/mcp-token`           |

### Just vs devenv scripts

Justfile and `devenv scripts.*` coexist with clear boundaries:

- **Justfile**: for end users at the terminal. `just dev`, `just lint`, `just deploy`. Invoked via `devenv shell -- just <target>`.
- **devenv scripts**: for the AI agent's internal use. Agent reads `scripts` block in `devenv.nix` and calls them directly as commands.

Both call the same underlying tools (bun, oxlint, wrangler). They differ only in interface: one keyboard, one agent.

### Grey area

| Situation               | Consider              | Note                  |
| ----------------------- | --------------------- | --------------------- |
| Bundle size is critical | Zod Mini (`zod/mini`) | 2.1kb vs 5.9kb        |
| Expo native             | Expo + Expo Router    | Shares oRPC contracts |
| Type-aware linting      | oxlint `--type-aware` | Alpha stage           |

---

## Version Tracking

Tool versions are tracked in `agent/versions.toml`. Before upgrading any dependency, verify the current version there and check the official registry for the latest.
