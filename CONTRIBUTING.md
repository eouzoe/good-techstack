# Contributing

Good-techstack is in its early stages. All contributions are welcome.

---

## How to contribute

- **Issues**: report bugs, suggest features, ask questions.
- **Pull requests**: fix a bug, add a feature, improve documentation.
- **Discussion**: share your experience using this stack.

Before opening a PR, check that your change passes the CI gate:

```bash
just typecheck     # tsc --noEmit
```

## Code style

- No unnecessary comments. Code should be self-documenting.
- Follow the patterns in `docs/reference/`.
- All new features must include tests.

---

## Version maintenance

All tool and library versions live in the lockfiles, not in a hand-written list. To check for outdated dependencies:

```bash
just check-versions
```

This compares every direct dependency (declared in a `package.json`) against the latest version on npm. Full detail — including the version-less package list and how to check non-npm packages (node, devenv, nix, secretspec) — is in [`docs/guide/version-check.md`](docs/guide/version-check.md). The Traditional Chinese version is [`docs/guide/version-check.zh.md`](docs/guide/version-check.zh.md).

If a dependency is outdated, report it (see the good first issue below). A maintainer bumps the version, syncs `bun.lock` / `flake.lock`, runs the tests, and merges. You do not need to build or test anything.

---

## Good First Issues

These are tasks suitable for first-time contributors. They require minimal context and have clear success criteria. Check the [GitHub issues](https://github.com/eouzoe/good-techstack/issues) for the latest list.

### Beginner

**Report an outdated dependency (no code required)**

Run `just check-versions`. If it reports an outdated **DIRECT** dependency, or you notice a non-npm package has a newer release, open an issue that says which package, the latest version, and the link you checked. Full steps and the package list: [`docs/guide/version-check.md`](docs/guide/version-check.md) (中文: [`docs/guide/version-check.zh.md`](docs/guide/version-check.zh.md)). Maintainers handle the bump and the tests.

**Version consistency checker (improve the existing script)**

A script already exists at `scripts/check-versions.mjs` and runs via `just check-versions`. Improve it — for example, add a weekly GitHub Action (`.github/workflows/version-check.yml`) that runs it and opens an issue when something is outdated.

**Files:** `scripts/check-versions.mjs`, `.github/workflows/version-check.yml`

---

**Verify curl|sh on a clean machine**

Set up a clean environment (fresh WSL, VM, or Docker), run the curl|sh command, and document everything that breaks or confuses you. Open issues for each problem.

**Files:** No code changes. Report findings as GitHub issues.

---

### Intermediate

**GitHub Actions CI pipeline**

Improve `.github/workflows/ci.yml` so it runs the two-layer gate (Layer 1: lint → type-check → unit test → integration test; Layer 2: `devenv test`) on every PR.

**Files:** `.github/workflows/ci.yml`

---

**Devenv development environment**

Document the `devenv` workflow for developers who do not use plain Nix. Cover `devenv shell`, `devenv process up`, `just` targets, and git-hooks.

**Files:** `devenv.nix`, `Justfile`, update `docs/guide/development.md`

---

**Test bootstrap flow with different AI agents**

Test the bootstrap prompt with each supported agent (Claude Code, opencode, Codex, Cursor) and document issues.

**Files:** No code changes. Report findings.

---

## Larger Contribution Areas

Some contributions span the entire stack and cannot be reduced to a single issue. These are documented in [`docs/guide/contribution-areas.md`](docs/guide/contribution-areas.md).

**Platform compatibility:**

- **macOS**: verify and fix the entire stack (start.sh, Bun, Nix, Wrangler, Playwright) on both Intel and Apple Silicon
- **Windows**: test native Windows support (Bun, Wrangler, Playwright) and document WSL1 vs WSL2 differences
- **Linux distributions**: test on Fedora, Arch, Alpine, NixOS and document distribution-specific issues

**Ongoing maintenance:**

- Monthly version audit: run `just check-versions`, then sync `bun.lock` / `flake.lock` and update reference docs
- Translate documentation from English to Chinese

**Infrastructure:**

- Expand E2E test coverage (registration, login, OAuth, CRUD, form validation)
- Add property-based testing with fast-check
- Editor setup guides (VS Code, Neovim, JetBrains)

Before starting any of these, open a discussion or issue to coordinate.

## Questions?

Open an issue or start a discussion. We aim to respond within a few days.
