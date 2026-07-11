# Testing

How to write and run tests in this project.

---

## Pre-execution Checklist

- [ ] `nix develop` has been run (toolchain is consistent)
- [ ] `bun install` is up to date
- [ ] Current working directory is the project root

## Test Layers

### L1: Smoke — `bun test` (`*.smoke.test.ts`)

Schemas compile, bindings are reachable, application boots.

```bash
bun test --filter "smoke"
```

### L2: Unit — `bun test` (`*.unit.test.ts`)

Pure function correctness, business logic edge cases.

```bash
bun test --filter "unit"
```

### L3: Contract — `bun test` (`*.contract.test.ts`)

oRPC contract input/output consistency, Zod schema compile checks.

```bash
bun test --filter "contract"
```

### L4: Property — `bun test` (`*.property.test.ts`)

fast-check fuzzing, serialise/deserialise round-trips.

```bash
bun test --filter "property"
```

### L5: Integration — `vitest run` (`*.integration.test.ts`)

D1, R2, KV, DO binding correctness running on workerd.

```bash
vitest run
```

### L6: E2E — `playwright` (`e2e/*.spec.ts`)

Happy path (register → create resource → logout), auth flow, security headers.

```bash
# Terminal 1: start the dev server
bunx wrangler dev --persist-to .wrangler/state &

# Wait for the server to be ready
sleep 5

# Terminal 2: run E2E tests
bunx playwright test
```

### L7: Production verification

Monitor error rate and p99 latency after deployment.

```bash
bunx wrangler tail
```

## CI Gate

Pull requests must pass:

```
oxlint --type-aware
  → tsc --noEmit
  → bun test (unit | contract | property)
  → vitest run (integration)
  → Pass → merge
```

## Coverage Targets

| Layer | Target |
|-------|--------|
| API routes | 100% (≥1 contract test per route) |
| DB queries | ≥1 integration test per query |
| Zod schemas | ≥1 smoke + ≥1 property test |
| Auth flow | 3 tests (register, login, logout) |
| Middleware | ≥1 unit test per middleware |
