# Development

Daily development workflow, commands, and conventions.

---

## Prerequisites

```bash
devenv shell        # Enter the development environment
devenv shell -- bun install   # Install JavaScript dependencies
```

## Dev Server

```bash
just dev             # Start backend + frontend dev servers
```

## Type Checking

```bash
just typecheck      # devenv shell -- tsc --noEmit
```

## Linting

```bash
just lint            # devenv shell -- oxlint --type-aware
```

## Testing

```bash
just test            # devenv shell -- bun test
just test-frontend   # devenv shell -- bunx rstest (frontend Rsbuild pipeline)
devenv shell -- bun test --watch   # TDD mode
devenv shell -- vitest run         # Integration tests (workerd)
devenv shell -- bunx playwright test   # E2E tests (requires alchemy dev)
```

## Database

```bash
devenv shell -- devenv tasks run db:generate   # Generate a new migration from src/server/db/schema.ts (drizzle-kit generate)
```

D1 migrations are applied automatically by `alchemy deploy` (the `DB` resource
in `alchemy.run.ts` declares `migrationsDir: './drizzle'`).

## Binding Types

Binding types come from `alchemy.run.ts` — `Cloudflare.InferEnv<typeof Website>`
flows into `WebsiteEnv` (`src/env.d.ts` augments `cloudflare:workers`), so there
is no generated `wrangler types` step.

## Pre-push Gate

CI runs only `just typecheck`. Run the full gate locally before pushing:

```bash
just lint             # oxlint --type-aware
just typecheck        # tsc --noEmit
just test             # bun test
just test-frontend    # rstest
devenv shell -- vitest run
```
