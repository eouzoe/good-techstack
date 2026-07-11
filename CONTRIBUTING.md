# Contributing

Good-techstack is in its early stages. All contributions are welcome.

---

## How to contribute

- **Issues**: report bugs, suggest features, ask questions.
- **Pull requests**: fix a bug, add a feature, improve documentation.
- **Discussion**: share your experience using this stack.

Before opening a PR, check that your change passes the CI gate:

```
oxlint --type-aware
tsc --noEmit
bun test
vitest run
```

## Code style

- No unnecessary comments. Code should be self-documenting.
- Follow the patterns in `docs/reference/`.
- All new features must include tests.

## Documentation style

- British English for all English documentation.
- Chinese documentation uses Traditional Chinese (zh-TW).
- Use plain, direct language. No marketing fluff.

---

## Good First Issues

These are tasks suitable for first-time contributors. They require minimal context and have clear success criteria. Check the [GitHub issues](https://github.com/eouzoe/good-techstack/issues) for the latest list.

### Beginner

**Version consistency checker**

Write a script that reads `docs/agent/versions.toml` and compares each documented version against the latest published version. Can be run manually or as a weekly GitHub Action.

**Files:** `scripts/check-versions.ts`, `.github/workflows/version-check.yml`

---

**Verify curl|bash on a clean machine**

Set up a clean environment (fresh WSL, VM, or Docker), run the curl|bash command, and document everything that breaks or confuses you. Open issues for each problem.

**Files:** No code changes. Report findings as GitHub issues.

---

### Intermediate

**GitHub Actions CI pipeline**

Create `.github/workflows/ci.yml` that runs lint → type-check → unit test → integration test on every PR.

**Files:** `.github/workflows/ci.yml`

---

**Docker development environment**

Create a Docker Compose setup for developers who do not use Nix.

**Files:** `Dockerfile`, `docker-compose.yml`, update `docs/guide/development.md`

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
