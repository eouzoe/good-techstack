---
title: "Environment alignment"
---


The `devenv shell` automatically provides the pinned tool versions
(bun, node, oxlint, oxfmt, wrangler, just, etc.) from the lock files.
No manual environment check is needed.

## Keeping dependencies up to date

```bash
just update    # bun update + devenv update
```

This updates both npm packages (`bun update`) and Nix packages
(`devenv update`). Run it periodically or when entering the project
after a long break.

## Why this used to be more complex

Earlier versions had `check-env.mjs` (compare local tools against
lock files) and `check-versions.mjs` (compare pinned deps against
npm latest). These were removed because:

- `devenv shell` already guarantees environment alignment
- `just update` is a simpler update workflow
- npm latest checking is a maintainer concern, not a daily task
