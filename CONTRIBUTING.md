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

## Version maintenance (click-link-report)

All tool/library versions live in **one file**: [`docs/agent/versions.toml`](docs/agent/versions.toml). It is the single source of truth. `package.json`, `devenv.nix`, and `flake.nix` carry the real pins; reference docs mirror them for readers.

We keep versions fresh through **human review**, not bots. The full process, per-package official source links, and the exact PR format are in **[Issue #2](https://github.com/eouzoe/good-techstack/issues/2)**.

Contributor checklist (that's all we ask):

1. Open `docs/agent/versions.toml`.
2. Open the `source` link for the package you want to check (official npm/GitHub page).
3. If a newer version exists, open **one atomic PR** that only bumps that entry's `version` and sets `updated = <today>`, pasting the source link + new version in the body.
4. No installs, no builds, no `package.json` edits. Maintainers test and merge.

One package per PR.

---

## Good First Issues

These are tasks suitable for first-time contributors. They require minimal context and have clear success criteria. Check the [GitHub issues](https://github.com/eouzoe/good-techstack/issues) for the latest list.

### Beginner

**Report an outdated version (no code required)**

Pick any package in `docs/agent/versions.toml`, open its `source` link, and if a newer version is published, open a one-line PR bumping that entry. Full steps + PR template: [Issue #2](https://github.com/eouzoe/good-techstack/issues/2).

**Files:** `docs/agent/versions.toml` (one entry)

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

- Monthly version audit: check all documented versions against latest, update `versions.toml` and reference docs
- Translate documentation from English to Chinese

**Infrastructure:**

- Expand E2E test coverage (registration, login, OAuth, CRUD, form validation)
- Add property-based testing with fast-check
- Editor setup guides (VS Code, Neovim, JetBrains)

Before starting any of these, open a discussion or issue to coordinate.

## Questions?

Open an issue or start a discussion. We aim to respond within a few days.
