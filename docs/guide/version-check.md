# Version checking

The project does **not** keep a hand-written list of versions. Such a list goes
stale the moment someone forgets to update it, and every reader sees outdated
numbers. Instead, the **lockfiles are the source of truth**, and a small script
compares them against what is published.

## Where versions actually live

| Concern                                               | File                                            | How it is controlled                       |
| ----------------------------------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Every npm dependency                                  | `bun.lock`                                      | Resolved by bun; refresh with `bun update` |
| Declared ranges                                       | `package.json` (root + `apps/*` + `packages/*`) | Edited by hand                             |
| devenv CLI                                            | `devenv.yaml` (`ref=v2.1.2`)                    | Bump the git ref, then `devenv update`     |
| nixpkgs tools (bun, node, oxlint, oxfmt, wrangler, …) | `flake.lock` (nixpkgs commit)                   | Move forward with `nix flake update`       |
| Nix daemon                                            | installed separately                            | Not tracked in the repo                    |

## How to check

Run the comparison script. It reads `bun.lock`, compares every **direct**
dependency against the latest version on npm, and tells you what is outdated:

```bash
just check-versions          # or: bun scripts/check-versions.mjs
```

Entries marked `DIRECT` are the dependencies we declare and can bump. That is
what a contributor reports. Transitive dependencies are managed by bun and are
not your concern unless a direct dependency needs updating.

## Package list (version-less)

This list never contains a version number, so it never goes stale. To see the
latest version of any entry, run the command in its row.

For every npm package the command is identical on **Windows, macOS, and Linux**
(because it uses bun):

```bash
bunx npm view <npm-name> version
```

| Package               | Role     | npm identifier (exact)            | Check latest                                            | Official link                             |
| --------------------- | -------- | --------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| bun                   | runtime  | `bun`                             | `bunx npm view bun version`                             | https://bun.sh                            |
| TypeScript            | language | `typescript`                      | `bunx npm view typescript version`                      | https://www.typescriptlang.org            |
| Hono                  | API      | `hono`                            | `bunx npm view hono version`                            | https://hono.dev                          |
| oRPC                  | API      | `@orpc/server`                    | `bunx npm view @orpc/server version`                    | https://orpc.dev                          |
| TanStack Start        | frontend | `@tanstack/react-start`           | `bunx npm view @tanstack/react-start version`           | https://tanstack.com/start                |
| TanStack Router       | frontend | `@tanstack/react-router`          | `bunx npm view @tanstack/react-router version`          | https://tanstack.com/router               |
| React                 | frontend | `react`                           | `bunx npm view react version`                           | https://react.dev                         |
| better-auth           | auth     | `better-auth`                     | `bunx npm view better-auth version`                     | https://better-auth.com                   |
| Drizzle ORM           | orm      | `drizzle-orm`                     | `bunx npm view drizzle-orm version`                     | https://orm.drizzle.team                  |
| Drizzle Kit           | orm      | `drizzle-kit`                     | `bunx npm view drizzle-kit version`                     | https://orm.drizzle.team/kit              |
| Zod                   | schema   | `zod`                             | `bunx npm view zod version`                             | https://zod.dev                           |
| oxlint                | lint     | `oxlint`                          | `bunx npm view oxlint version`                          | https://oxc.rs                            |
| oxfmt                 | format   | `oxfmt`                           | `bunx npm view oxfmt version`                           | https://oxc.rs                            |
| Rsbuild               | build    | `@rsbuild/core`                   | `bunx npm view @rsbuild/core version`                   | https://rsbuild.rs                        |
| Rspack                | build    | `rspack`                          | `bunx npm view rspack version`                          | https://rspack.dev                        |
| Vitest                | test     | `vitest`                          | `bunx npm view vitest version`                          | https://vitest.dev                        |
| Vitest pool (workers) | test     | `@cloudflare/vitest-pool-workers` | `bunx npm view @cloudflare/vitest-pool-workers version` | https://developers.cloudflare.com/workers |
| Wrangler              | deploy   | `wrangler`                        | `bunx npm view wrangler version`                        | https://developers.cloudflare.com/workers |
| Cloudflare types      | types    | `@cloudflare/workers-types`       | `bunx npm view @cloudflare/workers-types version`       | https://developers.cloudflare.com/workers |

### npm hygiene

The npm **package name** is not always the tool name. Always use the exact
identifier above — never guess:

- `rsbuild` (the CLI) comes from `@rsbuild/core`
- oRPC is published as `@orpc/server`
- Drizzle ORM is `drizzle-orm`, not `drizzle`
- TanStack Start is `@tanstack/react-start`

## Non-npm packages

These are not on npm, so the script does not check them. Check them by hand.

| Package    | How to check (macOS / Linux)                                    | How to check (Windows) | Official link                                 |
| ---------- | --------------------------------------------------------------- | ---------------------- | --------------------------------------------- |
| Node.js    | `nvm ls-remote \| tail` or `nix eval nixpkgs#nodejs_22.version` | `nvm list available`   | https://nodejs.org/en/about/previous-releases |
| devenv     | `devenv --version`                                              | `devenv --version`     | https://github.com/cachix/devenv/releases     |
| Nix        | `nix --version`                                                 | `nix --version`        | https://github.com/NixOS/nix/releases         |
| SecretSpec | `secretspec --version`                                          | `secretspec --version` | https://secretspec.dev                        |
| just       | `just --version`                                                | `just --version`       | https://github.com/casey/just/releases        |

## What to report

If `just check-versions` shows an outdated **DIRECT** dependency, or you notice a
non-npm package has a newer release, open an issue (or a one-line PR) that says:

- which package,
- the latest version you saw,
- the link you checked it at.

A maintainer bumps the version, syncs `bun.lock` / `flake.lock`, runs the tests,
and merges. You do not need to install, build, or test anything.

See [issue #2](https://github.com/eouzoe/good-techstack/issues/2) for the full
workflow.
