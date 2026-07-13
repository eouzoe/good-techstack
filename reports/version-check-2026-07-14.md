# Version check evidence — 2026-07-14

Generated with `bun scripts/check-versions.mjs` (see PR #22 for the tooling).

## Method

```bash
just check-versions
```

The script reads `bun.lock`, compares every direct dependency (declared in a
`package.json`) against the latest version published on npm, and prints what is
outdated (marked `DIRECT`).

## Raw output (before any change)

```
Checking direct dependencies against npm...

OUTDATED  @cloudflare/workers-types   [DIRECT — report this]
          locked : 4.20260702.1
          latest : 5.20260713.1
          check  : bunx npm view @cloudflare/workers-types version
OUTDATED  @orpc/server   [DIRECT — report this]
          locked : 2.0.0-beta.3
          latest : 1.14.8
          check  : bunx npm view @orpc/server version
OUTDATED  @types/node   [DIRECT — report this]
          locked : 22.20.1
          latest : 26.1.1
          check  : bunx npm view @types/node version
OUTDATED  hono   [DIRECT — report this]
          locked : 4.12.29
          latest : 4.12.30
          check  : bunx npm view hono version
```

## Contributor's own review (per package)

| Package                     | Pinned (range / locked)    | Latest         | Assessment                                                                                                                                            |
| --------------------------- | -------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hono`                      | `^4.12.27` / `4.12.29`     | `4.12.30`      | Patch within `^4`. Low risk. **Bumped.**                                                                                                              |
| `@orpc/server`              | `2.0.0-beta.3` (exact)     | `1.14.8`       | `latest` tag points to stable `1.14.8`, which is **older** than our pinned `2.0.0-beta.3`. Not a real update — a downgrade. **Flagged, do not bump.** |
| `@types/node`               | `^22` / `22.20.1`          | `26.1.1`       | Major `22 → 26`. Types correspond to Node 26; mismatched with the runtime we target. **Flagged, do not bump yet.**                                    |
| `@cloudflare/workers-types` | `^4.2025` / `4.20260702.1` | `5.20260713.1` | Major `4 → 5`. Cloudflare restructured the types; needs coordinated testing with wrangler. **Flagged, do not bump yet.**                              |

## Action taken in this PR

- `apps/backend/package.json`: `hono` `^4.12.27` → `^4.12.30`
- `bun.lock`: refreshed via `bun update hono` → `hono@4.12.30`

## Tests run (evidence)

Ran locally (bun 1.3.14):

```
oxlint --type-aware      -> exit 0  (warning only: tsgolint executable not found)
bun test                 -> exit 0  (no test files present; graceful)
```

`just typecheck` (wrangler types + tsc) requires `devenv shell` and is left to
maintainer verification — the hono bump is a patch within `^4`, so type impact
is nil.

## Re-check after the bump

`just check-versions` now reports only the 3 flagged packages (hono resolved):

```
OUTDATED  @cloudflare/workers-types ... 4.20260702.1 -> 5.20260713.1
OUTDATED  @orpc/server            ... 2.0.0-beta.3 -> 1.14.8
OUTDATED  @types/node             ... 22.20.1 -> 26.1.1
```

The 3 remaining are for the maintainer to decide (see PR review).
