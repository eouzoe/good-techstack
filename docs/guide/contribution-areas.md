# Contribution Areas

This file describes long-term, ongoing, and large-scope contributions. Unlike the issues tagged "good first issue", these areas require more context, span multiple parts of the stack, or involve platform-specific testing that the core team cannot do alone.

---

## 1. Platform Compatibility

The stack is currently developed and tested primarily on **Linux (x86_64)** via WSL on Windows. Every other platform needs verification and potentially fixes.

### macOS

macOS is the second most common development environment. The following need attention:

**start.sh detection and instructions**

- Detect macOS (`uname -s` = `Darwin`)
- Print Mac-specific terminal instructions (open Terminal.app, no WSL needed)
- Handle both Intel (x86_64) and Apple Silicon (arm64)

**Toolchain compatibility**

- Bun: verify installation and runtime on both Intel and Apple Silicon
- Nix: verify `flake.nix` works on macOS (nix-darwin vs nixpkgs, `devenv shell` behaviour)
- Homebrew: if the user does not have Nix, can the stack use Homebrew? Write a `install.sh` fallback
- Devenv: verify `devenv hook zsh` works on macOS

**File system**

- macOS uses case-insensitive file system by default. Verify this does not cause issues with TypeScript imports, D1 databases, or any tool in the stack.
- Test with a case-sensitive volume (some developers use this)

**Shell**

- macOS defaults to zsh. Verify all scripts in the repo are zsh-compatible.
- Check for bash-specific syntax that would break under zsh.

**Cloudflare Workers local development**

- `wrangler dev`, `wrangler d1`, `wrangler types`: verify all work on macOS
- `vitest-pool-workers`: verify integration tests run on macOS
- `playwright`: verify E2E tests run on macOS

**Scope of work:** moderate. Most tools (Bun, Wrangler, Playwright) officially support macOS. The work is primarily in `scripts/start.sh`, documentation updates, and platform-specific testing.

---

### Windows

The stack currently requires WSL2 on Windows. Full native Windows support (Git Bash, PowerShell) is a larger effort.

**WSL1 vs WSL2**

- The instructions recommend WSL2. Test with WSL1 and document any issues.
- WSL1 has different system call behaviour that can affect Bun, Nix, and Docker.
- File system performance: WSL1 vs WSL2 for projects inside the Linux vs Windows file system.

**Native Windows (no WSL)**

- Bun has native Windows support (since Bun 1.2). Test `bun install`, `bun run dev`, `bun test` directly in Windows.
- Nix does not run natively on Windows. The stack would need an alternative environment manager (or Docker).
- Cloudflare Wrangler has native Windows support. Test `wrangler dev`, `wrangler deploy` directly in Windows PowerShell.
- Playwright has native Windows support.
- Document the differences and trade-offs for users who cannot or will not use WSL.

**Line endings**

- The repo currently uses LF line endings. Verify `.gitattributes` handles CRLF correctly on Windows.
- Test that `bunx wrangler` scripts, shell scripts, and Nix files work after checkout on Windows.

**Path separators**

- Bun uses `/` internally on all platforms, but test that any path manipulation in the stack is cross-platform safe.
- Check whether D1 migrations, file reads, or import paths break with `\`.

**Scope of work:** large. WSL2 is a reasonable requirement for now, but documenting the native Windows story would lower the barrier significantly.

---

### Linux distributions

The stack is developed on Ubuntu via WSL. Other distributions may differ.

| Distribution        | Likely issues                                                                           | What to test                                            |
| ------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Fedora / RHEL       | `nix install` method differs; SELinux may block wrangler; `dnf` vs `apt`                | `start.sh` package detection, Nix install, wrangler dev |
| Arch Linux          | Rolling release may have newer (incompatible) versions; `sudo` vs `doas`                | Tool version consistency, permission model              |
| Alpine Linux        | musl libc instead of glibc; some binaries may not work                                  | Bun (officially supports musl), Nix, wrangler           |
| NixOS               | Nix is native but `devenv shell` behaviour differs; `/usr/bin/env` not always available | `flake.nix`, shebangs, path assumptions                 |
| non-systemd distros | Some tools assume systemd for service management                                        | Not typically relevant (stack does not use systemd)     |

For each distribution, the test procedure is:

1. Install the distribution (fresh VM or container)
2. Run the curl|bash command
3. Document what breaks and what works
4. Update `scripts/start.sh` and documentation accordingly

**Scope of work:** moderate per distribution. Most tools distribute static binaries and work on any Linux. The main variable is Nix installation and package availability.

---

## 2. Version Maintenance

This is an ongoing responsibility, not a one-time task.

**Version checker**

- Run `just check-versions` (or `bun scripts/check-versions.mjs`) to compare declared versions in `package.json` and `bun.lock` against the latest published versions.
- The script should exit with code 1 if any documented version is outdated.
- Set up a weekly GitHub Action to run the checker and open an issue if versions are out of date.

**Monthly version audit**

- Every 4-6 weeks, run the version checker and update:
  - `docs/reference/*.md` if behaviour changed between versions
  - `docs/getting-started.md` if the setup or prerequisites changed between versions
- This is the kind of maintenance that does not require deep context. Anyone can do it.

---

## 3. Documentation Gaps

**Translate reference docs**

- `docs/reference/typescript.md` has no Chinese version yet
- `docs/reference/design-decisions.md` has no Chinese version yet
- `docs/guide/development.md`, `docs/guide/deployment.md`, `docs/guide/testing.md` have no Chinese versions
- Translation should be technical and accurate, not creative

**Agent documentation**

- `docs/agent/scaffolding.md` has no Chinese version yet
- The forced review mechanism could use more concrete examples in both languages

**Tutorial by example**

- Write a step-by-step tutorial that walks through creating a specific product (e.g. a link-in-bio page, a waitlist, a simple CRM) from zero to deployed
- This would serve as both documentation and a integration test

---

## 4. Testing Infrastructure

**CI pipeline** (`.github/workflows/ci.yml`)

- Lint → type-check → unit test → integration test on every PR
- Run on push to `main` and on pull requests
- Cache Nix store and `node_modules` for speed

**E2E test expansion**

- Current E2E coverage is minimal
- Write tests for: registration, login, OAuth flow, password reset, CRUD operations, form validation errors, error boundaries, loading states
- Run against a local `wrangler dev` instance in CI

**Property-based testing**

- Use `fast-check` to fuzz Zod schemas and oRPC contracts
- Verify that serialise/deserialise round-trips are lossless
- Catch edge cases that unit tests miss

---

## 5. Developer Experience

**Devenv development environment**

- Document the `devenv` workflow for developers who do not use plain Nix.
- Cover `devenv shell`, `devenv process up`, `just` targets, and git-hooks.
- Document alongside the existing Nix setup

**Alternative AI agent support**

- The `start.sh` script currently supports Claude Code, opencode, Codex, and Cursor
- Test each agent with the bootstrap flow end-to-end
- Document which prompts work well and which break
- Add support for additional agents (GitHub Copilot CLI, aider, etc.)

**Editor setup guide**

- VS Code: recommended extensions, workspace settings, debug configurations
- Neovim: LSP configuration, formatter settings, DAP
- JetBrains: setup notes

---

## 6. How to Choose What to Work On

| If you...                               | Start with                                      |
| --------------------------------------- | ----------------------------------------------- |
| Have a Mac and want to make it work     | 1. Platform Compatibility → macOS               |
| Use a non-Ubuntu Linux distro           | 1. Platform Compatibility → Linux distributions |
| Want a regular, low-effort contribution | 2. Version Maintenance                          |
| Are bilingual (Chinese + English)       | 3. Documentation Gaps → Translation             |
| Know CI/CD well                         | 4. Testing Infrastructure → CI pipeline         |
| Prefer testing over coding              | 4. Testing Infrastructure → E2E expansion       |
| Want to use Docker instead of Nix       | 5. Developer Experience → Docker                |

Before starting any of these, open a discussion or issue first so we can coordinate and avoid duplicate work.
