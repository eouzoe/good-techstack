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

These are tasks suitable for first-time contributors. They require minimal context and have clear success criteria.

### Beginner

**1. macOS support for start.sh**

The current `start.sh` assumes a Linux environment (via WSL on Windows). Mac users can open Terminal.app directly. Modify `start.sh` to detect macOS and adjust the instructions accordingly.

**Task:**
- Detect `uname -s` = `Darwin`
- Print Mac-specific terminal instructions instead of WSL instructions
- Test on an actual Mac

**Files:** `scripts/start.sh`

---

**2. Version consistency checker**

The `docs/agent/versions.toml` file tracks tool versions. Over time, documented versions drift from what is actually latest. A script that checks and reports discrepancies would keep the documentation honest.

**Task:**
- Write a script (Bun/TypeScript or bash) that:
  - Reads `docs/agent/versions.toml`
  - Runs `npm view <package> version` for each npm package
  - Runs `bun --version` for Bun
  - Compares documented vs latest
  - Reports mismatches
- Can be run manually or as a weekly GitHub Action

**Files:** New file (e.g. `scripts/check-versions.ts`), `.github/workflows/version-check.yml`

---

**3. Verify curl|bash works on a clean machine**

The core promise of the project is "one command to start." Test this on a clean machine (fresh WSL install, no Node.js, no Bun, no Nix) and document any issues found.

**Task:**
- Set up a clean environment (VM, Docker, or fresh WSL)
- Run the curl|bash command
- Document what broke, what was confusing, what could be improved
- Open issues for each problem found

**Files:** No code changes needed. Report findings as GitHub issues.

---

### Intermediate

**4. GitHub Actions CI pipeline**

The project needs a CI pipeline that runs the full test suite on every PR.

**Task:**
- Create `.github/workflows/ci.yml`
- Jobs: lint → type-check → unit test → integration test
- Use Node.js for integration tests (wrangler/vitest-pool-workers requires Node)
- Cache Nix store and Bun dependencies

**Files:** New `.github/workflows/ci.yml`

---

**5. Docker development environment**

Not all developers use Nix. A Docker Compose setup would lower the barrier to entry.

**Task:**
- Create `Dockerfile` and `docker-compose.yml`
- Install Bun, the stack dependencies
- Mount the project directory for live development
- Document how to use it alongside the Nix setup

**Files:** New `Dockerfile`, `docker-compose.yml`, update `docs/guide/development.md`

---

**6. Test the bootstrap flow with different AI agents**

The `start.sh` script detects and supports Claude Code, opencode, Codex, and Cursor. Each agent behaves differently. Testing the bootstrap prompt with each and documenting issues would improve reliability.

**Task:**
- Install each supported agent
- Run the bootstrap flow
- Document which prompts work, which break, and what the agent did wrong

**Files:** No code changes. Report findings as GitHub issues.

---

### Long-term / Ongoing

**7. Keep version documentation up to date**

Every few weeks, run `scripts/check-versions.ts` (once it exists) and open a PR to update any versions that have changed. This is the kind of chore that keeps the project honest.

**Task:**
- Run the version checker monthly
- Update `docs/agent/versions.toml` and any changed behaviour in `docs/reference/`
- Open a PR

---

**8. Expand E2E test coverage**

More E2E tests means fewer regressions. Every new feature should include a Playwright test.

**Task:**
- Write E2E tests for: registration flow, OAuth login, password reset, form validation, error states
- Ensure tests run reliably in CI

**Files:** `e2e/` directory, `playwright.config.ts`

---

**9. Translate reference docs**

The Chinese (zh-TW) documentation currently covers only the main README and some `reference/` files. Translating the remaining English documentation would make the stack accessible to more people.

**Task:**
- Translate a `reference/*.md` file of your choice to `reference/*.zh.md`
- Keep the technical content accurate
- Follow the same structure as the English original

**Files:** Any `docs/reference/*.md` that lacks a `.zh.md` counterpart

---

## Questions?

Open an issue or start a discussion. We aim to respond within a few days.
