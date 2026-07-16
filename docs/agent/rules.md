# Agent Behaviour Rules

> This document is written for the agent. Violating these rules produces unacceptable output.
> Last updated: 2026-07-12

## 1. Cite sources

- Every non-obvious statement must include a source (URL with fragment, or file path).
- Version information must come from an official query (`npm view`, `bun --version`), never from memory.

## 2. Do not guess versions

- If you do not know the correct version, say: "I am not certain. Please run `npm view <package> version`."
- Never state "the latest version is X.Y.Z" without a source.
- Verify current tool and dependency versions with `just check-versions`, which reads `bun.lock` and `package.json` directly (no hand-maintained version table).

## 3. Reject out-of-stack tools

- Do not suggest Prisma (this stack uses Drizzle). Do not suggest Next.js (this stack uses TanStack Start). Do not suggest ESLint (this stack uses oxlint).
- Exception: if the user explicitly asks for a comparison, explain the stack's choice first, then compare.
- Standard response template: "This stack uses X (see `docs/reference/X.md`). Y is an option but is not part of this stack."

## 4. Reading order

Before processing any request related to this stack, the agent must:

1. Read `docs/getting-started.md` to understand the structure.
2. Read `docs/reference/design-decisions.md` (inviolable principles).
3. Read the relevant `docs/reference/*.md` or `docs/guide/*.md`.
4. Read `docs/agent/scaffolding.md` if this is a new project or the user is describing a new product idea.
5. Run `just check-versions` to confirm dependency versions are current.

### New project flow

If you were started by `start.sh`, you were given `docs/agent/bootstrap-prompt.md` as your initial prompt. Follow it in order.

If you are starting without the bootstrap prompt (user already has the stack):

1. Read `docs/getting-started.md` for an overview.
2. Read `docs/agent/scaffolding.md` and follow the Q&A protocol.
3. Do not start generating code without completing the discovery phase.
4. Enforce the forced review mechanism: exact confirmation phrase required.

## 5. Output format

- Cite the source before answering (file path + line number or section name).
- Label code examples with their file path.
- Do not output irrelevant preamble or postamble.
- Be concise: use lists instead of paragraphs.

## 6. Documentation update discipline

- Before changing a file: read `docs/getting-started.md` for context.
- After changing: write a changelog entry to `CHANGELOG/`. Create `CHANGELOG/YYYY-MM-DD-slug.md`.
- Do not modify files outside this project for synchronisation purposes.

## 7. Security

- Never output API tokens, keys, or passwords anywhere.
- Reference tokens using the file variable syntax `{file:~/.cloudflare/mcp-token}`, never by value.
- CI secrets are injected through GitHub Secrets. Do not write them in code or documentation.
- Before reading or writing any secret: read `secretspec.toml` first to confirm the key exists.
- Use `secretspec run -- <cmd>` to inject secrets into a command. Do not pass secrets via `--env` flags.
