# Testing Contract

How tests are wired in this project. Two classes — read both before adding tests.

## Class 1 — Environment & quality gates (always on)

Run by `devenv test` (enterTest, `--mode all`). These gate every commit/CI run
and are **not** product tests:

| Task                                       | Tool                | What it proves                                   |
| ------------------------------------------ | ------------------- | ------------------------------------------------ |
| `deps:install`                             | bun                 | lockfile resolves, deps present                  |
| `deps:gen-types`                           | wrangler types      | backend bindings typed (gitignored, regenerated) |
| `lint`                                     | oxlint --type-aware | no lint errors                                   |
| `typecheck:backend` / `typecheck:frontend` | tsc --noEmit        | types compile (incl. Zod4 contract types)        |
| `test:backend`                             | bun test            | backend unit tests (see below)                   |
| `test:frontend`                            | rstest              | frontend tests through Rsbuild pipeline          |

Run a single gate: `devenv tasks run lint`. Run the full graph: `devenv test`.

## Class 2 — Product tests (on-demand, MVP-scoped)

The template pre-wires the **framework** for these but ships **no business
tests** — add them once the business layer exists. Each layer below lists the
tool, what to test, and the unlock trigger.

### Frontend (TanStack Start + Rsbuild, Rstest)

Config: `apps/frontend/rstest.config.ts` (jsdom, Testing Library, strict mode).
Write `*.test.tsx` under `src/`.

- **Unit / component** — render a component, assert output. Use
  `@testing-library/react` + `jest-dom` matchers (setup in `rstest.setup.ts`).
- **Route harness** — when `@tanstack-router-testing` is added, load a single
  route or the full `routeTree.gen` via `createRouterHarness`, assert
  loaderData/render without a live server.
- **Hydration mismatch** — strict mode in `rstest.setup.ts` catches server HTML
  !== client HTML, and non-serializable props passed RSC → client. This bug is
  invisible to the eye pre-prod; catch it here.
- **Visual regression / E2E (Playwright)** — NOT pre-wired. Add when a critical
  user path exists; run as a separate task (`test:e2e:frontend`), not in the
  default `devenv test` graph (too slow).

### Backend (Hono + oRPC + Bun, bun test)

Config: `apps/backend` runs `bun test` over `*.test.ts`.

- **Unit** — pure functions: pricing, transforms, authz decisions. No DB, no net.
- **Contract** — Zod4 schema boundaries (feed invalid input, assert Zod rejects
  with clear messages) + oRPC `implement` fake handler to verify each route
  honours its input/output contract without starting a server or touching I/O.
- **Integration / smoke / D1 migration / auth / cache** — see memory
  (`testing-strategy.md`). Wire as `processes.<name>.task` + `backend.after`
  once the layer exists.

## Root-cause avoidance (prefer over patching)

- **Schema drift** — Drizzle schema is the single source of truth; migrations
  are generated from it (`drizzle-kit`), so hand-written drift can't happen.
- **Constraint violations** — declare `unique`/`check`/FK in Drizzle schema;
  the DB enforces natively. Tests only confirm the declaration holds.
- **Contract drift** — oRPC v2 + Zod4 shared types make frontend/backend align
  at type-check time; contract tests verify the schema rules and handler honours.

## Performance note

devenv (Rust) + bun (Rust) make test execution cheap. AI tasks span hours and
run in parallel — keep gates on by default and run them in the background;
don't trade coverage for speed.
