---
title: "Deployment"
---


Deploy to Cloudflare Workers via **alchemy**. `alchemy.run.ts` is the IaC
layer: it declares every Cloudflare binding (D1, KV, DO, Rate Limit, auth
config) as an `Effect` resource. `alchemy deploy` runs the Vite build with its
Cloudflare plugin injected, applies D1 migrations, and uploads the Worker.

---

## Prerequisites

- [ ] `alchemy.run.ts` declares all bindings (D1, KV, DO, Rate Limit)
- [ ] `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` resolved via `secretspec check`
- [ ] `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL` resolved (they live in the `deploy` scope too)

## Deploy

```bash
just deploy             # secretspec run --scope deploy -- bunx alchemy deploy
```

`secretspec run --scope deploy` injects exactly the deploy-scoped secrets (CF
token + account id + auth secrets) into the child environment, then alchemy
builds and deploys. D1 migrations declared in `alchemy.run.ts` are applied
automatically as part of the deploy.

### Live environment URL

The `deploy` scope resolves `BETTER_AUTH_URL` from the **default** profile
(`http://localhost:1337` for local dev) unless you override it per environment.
Point the live site at its real URL with the `production` profile so
better-auth redirects to the workers.dev (or custom) domain:

```bash
secretspec set --profile production BETTER_AUTH_URL https://<your-domain>
secretspec run --scope deploy --profile production -- bunx alchemy deploy
```

`production` inherits the default profile, so only `BETTER_AUTH_URL` needs the
per-env value. Changing it triggers a `[Website] update` — the D1/KV resources
are left untouched.

### Seeding the live D1

`alchemy deploy` applies migrations but the fresh live database has **no rows**
— the site returns `No technologies found` until you seed it. Seed the live D1
with the same fixture data used in dev:

```bash
secretspec run --scope deploy -- bunx wrangler d1 execute <database-name> \
  --remote --file=cli/seed-live.sql
```

Find `<database-name>` (`gstack-DB-dev-…`) in
`.alchemy/state/gstack/<profile>/DB.json` under `attr.databaseName`.
`cli/seed-live.sql` is idempotent — it clears the two fixture tables before
inserting, so it can be re-run safely.

## Cold-start profiling

```bash
just startup           # (removed in the alchemy switch — no standalone build artifact)
```

Standalone cold-start profiling via `wrangler check startup` needs a build
artifact that no longer exists — builds are driven inside `alchemy deploy`.
Profile cold start on a deployed Worker instead (alchemy `tail`/Cloudflare
dashboard) or re-add a standalone build when the local-dev workflow (see the
session TODO) is restored.

## Deploy script

`just deploy` runs `secretspec run --scope deploy -- bunx alchemy deploy`
directly — there is no intermediate `scripts/deploy.ts`.

## Type generation

No `wrangler types` step. Binding types are derived from `alchemy.run.ts` via
`Cloudflare.InferEnv<typeof Website>` → `WebsiteEnv` → `src/env.d.ts` augments
the `cloudflare:workers` module.

## Pre-deploy checklist

```bash
just lint                # oxlint --type-aware
just typecheck           # tsc --noEmit
just test                # vitest run (+ vitest.worker.config for workerd)
```

## CI/CD

CI runs `devenv tasks run typecheck:backend typecheck:frontend` on three OSes.
Lint and test are run locally before push but are not part of the CI pipeline.
Deploy is manual — no CI pipeline includes it.
