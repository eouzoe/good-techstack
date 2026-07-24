# Test Strategy: Seven-Layer Matrix

> depends_on: [00-runtime.md, 06-infra.md]
> tags: [test, quality, ci, verification]
> Checklist at: `docs/en/guide/testing.md`
> Last updated: 2026-07-10

## Principle

Use the fastest tool in the development loop. Use the most realistic tool in the CI gate.

```bash
# Daily development (millisecond feedback)
devenv shell -- bun test                    # All unit + contract + property
devenv shell -- bun test --watch            # TDD mode
devenv shell -- bun test --coverage         # Coverage
devenv shell -- bunx rstest                 # Frontend tests (Rsbuild pipeline)

# CI gate (workerd correctness)
devenv shell -- vitest run                  # vitest-pool-workers integration

# Before deployment
devenv shell -- bunx playwright test        # E2E (against wrangler dev)

# Production monitoring
devenv shell -- bunx wrangler tail          # Real-time error monitoring
```

## Test layers

|     Layer      | Tool                            | Runtime      |  Speed  |    CI?     | What it tests                                |
| :------------: | ------------------------------- | ------------ | :-----: | :--------: | -------------------------------------------- |
|    1. Smoke    | `bun test`                      | Bun JSC      |  <50ms  |    Yes     | Schema compiles, bindings connect, app boots |
|    2. Unit     | `bun test`                      | Bun JSC      | <200ms  |    Yes     | Pure functions, business logic               |
|  3. Contract   | `bun test`                      | Bun JSC      | <500ms  |    Yes     | oRPC contract consistency                    |
|  4. Property   | `fast-check`                    | Bun JSC      |   <1s   |    Yes     | Fuzzing edge cases                           |
| 5. Integration | `vitest-pool-workers`           | workerd      |  5-30s  | Local only | D1, R2, KV, DO bindings                      |
|     6. E2E     | `@playwright/test`              | Real browser | 30-120s | No, manual | Happy path, auth, security                   |
| 7. Production  | `wrangler tail` + Observability | Production   |   N/A   |     No     | Error rate, p99                              |

## CI gate matrix

CI runs `devenv tasks run typecheck:backend typecheck:frontend` on three OSes. All other layers (lint, unit, contract, property, integration) are run locally before push.

```
PR → just typecheck     (devenv tasks run typecheck:backend typecheck:frontend)
   → PASS ✅
```

The local gate before pushing is:

```
just lint             (oxlint --type-aware)
  → just typecheck    (tsc --noEmit)
  → just test         (bun test: unit | contract | property)
  → just test-frontend(rstest: frontend through Rsbuild pipeline)
  → devenv shell -- vitest run (integration, workerd)
```

## oxlint + oxfmt

| Tool   | Role                    | Performance    |
| ------ | ----------------------- | -------------- |
| oxlint | Rust linter, 840+ rules | 50-100x ESLint |
| oxfmt  | Rust formatter          | 30x Prettier   |

Type-aware linting via `tsgolint`: `oxlint --type-aware`. Supports 59/61 typescript-eslint type-aware rules.

## Coverage targets

| Layer               | Target                                | Tool                 |
| ------------------- | ------------------------------------- | -------------------- |
| API routes          | 100%                                  | bun test --coverage  |
| DB queries          | One integration test per query        | vitest run (workerd) |
| Frontend components | Core components have rstest tests     | rstest               |
| Zod schemas         | One smoke + one property per schema   | bun test             |
| Auth flow           | Three tests (register, login, logout) | playwright           |

## E2E notes (CF Workers + Playwright)

- Target `wrangler dev`, not `vite dev` (CSP + Vite HMR conflict)
- Add `--persist-to .wrangler/state` (otherwise D1 SQLite is empty)
- Use WebAuthn virtual authenticator, not `DEV_BYPASS_USER_ID`
- Third-party OAuth: seed session row + inject cookie

## Official docs

- Rstest: https://rstest.rs
- Playwright: https://playwright.dev
- fast-check: https://fast-check.dev
- CF vitest-pool-workers: https://developers.cloudflare.com/workers/testing/vitest-integration/
- oxc: https://oxc.rs/docs/guide/usage.html
