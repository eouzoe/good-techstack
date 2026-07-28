# Deployment

Safe deployment to Cloudflare Workers using the wrangler versions API.

---

## Prerequisites

- [ ] `wrangler.toml` is configured with the correct `name` and `account_id`
- [ ] `~/.cloudflare/mcp-token` exists and is valid (or `CLOUDFLARE_API_TOKEN` set)
- [ ] D1 database is created (`wrangler d1 create <name>`)

## Deploy

```bash
just deploy             # upload version → deploy 100%
```

Uses `wrangler versions upload` + `wrangler versions deploy` under the hood.

### With smoke test

```bash
just deploy --smoke     # upload at 0% → smoke test → promote to 100%
```

This uploads a new version at 0% traffic, prints a `curl` command with the
`Cloudflare-Workers-Version-Overrides` header for testing, and waits for
confirmation before promoting to 100%.

### Dry run

```bash
just deploy --dry-run   # upload only, no deployment
```

## Cold-start profiling

```bash
just startup           # build + wrangler check startup
```

Runs `wrangler check startup` (wrangler ≥4.116) to profile the Worker's cold
start. It prints bundle size (raw + gzip) and a CPU summary per phase (sampled,
active incl. GC, idle) and writes `worker-startup.cpuprofile`, which you can
open as a flame graph in Chrome DevTools / VS Code. Use it as a baseline before
and after dependency or architecture changes.

## Deploy script

See `scripts/deploy.ts` for the implementation. The script:

1. Checks for `wrangler.toml`
2. Parses the worker name
3. Runs `wrangler versions upload`
4. (Optional) deploys at 0% for smoke testing
5. Runs `wrangler versions deploy <version>@100% -y`

## Type generation

After setting up bindings in `wrangler.toml`, generate fresh types:

```bash
bunx wrangler types
```

This creates `worker-configuration.d.ts` with the correct `Env` interface
based on your compatibility date, flags, and bindings.

## Pre-deploy checklist

```bash
just lint                # oxlint --type-aware
just typecheck           # tsc --noEmit
just test                # oxlint
```

## CI/CD

CI runs `devenv tasks run deps:lint` on three OSes. Lint and test are run
locally before push but are not part of the CI pipeline.
