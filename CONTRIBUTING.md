# Contributing

Good-techstack is in its early stages. All contributions are welcome.

---

## How to contribute

- **Issues**: report bugs, suggest features, ask questions.
- **Pull requests**: fix a bug, add a feature, improve documentation.
- **Discussion**: share your experience using this stack.

Before opening a PR, run the full gate:

```bash
devenv test        # lint, type checks, tests, docs (devenv.nix → enterTest)
```

## Code style

- No unnecessary comments. Code should be self-documenting.
- Follow the patterns in `docs/src/content/docs/en/reference/`.
- All new features must include tests.

---

## Version maintenance

All tool and library versions live in the lockfiles, not in a hand-written list. To move everything to the latest release:

```bash
just update    # bun update + devenv update
```

Outdated dependencies are a maintainer concern. If you notice something stale — an npm package, or a tool such as node, devenv, nix or secretspec — open an issue naming the package, the latest version, and the link you checked. A maintainer bumps the version, syncs `bun.lock` / `devenv.lock`, runs the tests, and merges. You do not need to build or test anything. See the docs: `docs/src/content/docs/en/guide/env-check.md`.

---

## Good First Issues

These are tasks suitable for first-time contributors. They require minimal context and have clear success criteria. Check the [GitHub issues](https://github.com/eouzoe/good-techstack/issues) for the latest list.

### Beginner

**Report an outdated dependency (no code required)**

If you notice a dependency — an npm package or a tool such as node, devenv, nix or secretspec — has a newer release than the one in our lockfiles, open an issue that says which package, the latest version, and the link you checked. Maintainers handle the bump and the tests.

---

**Verify curl|sh on a clean machine**

Set up a clean environment (fresh WSL, VM, or Docker), run the curl|sh command, and document everything that breaks or confuses you. Open issues for each problem.

**Files:** No code changes. Report findings as GitHub issues.

---

### Intermediate

**GitHub Actions CI pipeline**

Improve `.github/workflows/ci.yml`: the Linux job runs the full devenv task gate, macOS runs a subset, and Windows only checks the bootstrap scripts. Extend coverage and platform parity on every PR.

**Files:** `.github/workflows/ci.yml`

---

**Devenv development environment**

Document the `devenv` workflow for developers who do not use plain Nix. Cover `devenv shell`, `devenv processes up`, `just` targets, and git-hooks.

**Files:** `devenv.nix`, `Justfile`, update `docs/src/content/docs/en/guide/development.md`

---

**Test bootstrap flow with different AI agents**

Test the bootstrap prompt with each supported agent (Claude Code, opencode, Codex, Cursor) and document issues.

**Files:** No code changes. Report findings.

---

## Larger Contribution Areas

Some contributions span the entire stack and cannot be reduced to a single issue. These are documented in [`docs/src/content/docs/en/guide/contribution-areas.md`](docs/src/content/docs/en/guide/contribution-areas.md).

**Platform compatibility:**

- **macOS**: verify and fix the entire stack (start.sh, Bun, Nix, alchemy) on both Intel and Apple Silicon
- **Windows**: test native Windows support (Bun, Nix) and document WSL1 vs WSL2 differences
- **Linux distributions**: test on Fedora, Arch, Alpine, NixOS and document distribution-specific issues

**Ongoing maintenance:**

- Monthly version audit: run `just update` and refresh the reference docs
- Translate documentation from English to Chinese

**Infrastructure:**

- Expand E2E test coverage (registration, login, OAuth, CRUD, form validation)
- Extend property-based testing (fast-check) coverage
- Editor setup guides (VS Code, Neovim, JetBrains)

Before starting any of these, open a discussion or issue to coordinate.

## Questions?

Open an issue or start a discussion. We aim to respond within a few days.
