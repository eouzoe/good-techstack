# Check your local environment (Linux)

`check-versions` tells maintainers when a pinned dependency is behind upstream.
This check tells **you** whether the tools on your own machine match what the
project provides — because if you run a newer or different version and it
breaks, nobody is responsible for the fallout. The project guarantees the
pinned set works, and we maintain it.

## Run it

```bash
just check-env          # or: bun scripts/check-env.mjs
```

Linux only. The fix commands below are bash.

## What it compares

The script reads the project's own pins and compares them with the versions on
your `PATH`:

| Source                 | Tools                                              |
| ---------------------- | -------------------------------------------------- |
| `flake.lock` (nixpkgs) | bun, node, oxlint, oxfmt, wrangler, prettier, just |
| `devenv.yaml`          | devenv CLI (`ref=v2.1.2`)                          |
| `bun.lock`             | npm CLIs such as drizzle-kit                       |

## A mismatch means align, not upgrade

If a tool differs, the fix is to use the project's pinned version — most often
by entering the devenv shell, which provides exactly that set:

```bash
devenv shell            # provides exactly the pinned tool versions
# or, for auto-entry on every cd:
direnv allow
```

For npm CLIs that live in `bun.lock` (e.g. `drizzle-kit`), sync with:

```bash
bun install             # pulls pinned versions from bun.lock
```

Do **not** `npm i -g` / download the newest release to "fix" a mismatch. Use
the project's version; we look after it.

## Why this is separate from `check-versions`

- `check-versions` compares our pinned deps against the **official latest** —
  a maintainer signal (a contributor reports a newer release; we bump).
- `check-env` compares **your machine** against the **project-pinned** versions
  — a contributor safeguard (use our version, not a newer one that breaks).

See [version-check.md](version-check.md) for the dependency freshness check.
