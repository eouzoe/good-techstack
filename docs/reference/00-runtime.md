# Runtime: Bun

> depends_on: []
> tags: [runtime, javascript, typescript, dev-tool]
> Last updated: 2026-07-10

## Why Bun

- Single binary: runtime + package manager + test runner + bundler
- JavaScriptCore engine. Cold start 1.2ms (Node.js is 45ms)
- Web Standards API support is native
- `Bun.password`: Argon2id hash, hardware-accelerated

## Bun 1.3 features

| Version | Notable                                          |
| ------- | ------------------------------------------------ |
| 1.3.0   | `Bun.serve()` HTTP/3, Image API, warm install 7x |
| 1.3.10  | REPL Zig rewrite, Windows ARM64, TC39 decorator  |
| 1.3.12  | `Bun.WebView`, `Bun.cron()`, Markdown-to-ANSI    |

## Bun Workspace (monorepo)

```
project/
├── apps/backend/       # Hono + oRPC + better-auth
├── apps/frontend/      # TanStack Start
├── packages/shared/    # Types, contracts, schemas
├── package.json (workspaces: ["apps/*", "packages/*"])
├── bun.lock
```

Not choosing Turborepo or Nx: Bun workspace + `bun test` is fast enough. Extra complexity has no benefit.

## Bun + wrangler compatibility

| Scenario               | Result                                                   |
| ---------------------- | -------------------------------------------------------- |
| `bunx wrangler deploy` | Works on Linux and Mac. Windows has an issue (bun#10464) |
| `bunx wrangler dev`    | Mostly usable. DO hang fixed (bun#16240)                 |
| CI/CD                  | Use Node.js                                              |

Sources: bun#10464, bun#16240, workers-sdk#9699

## Official docs

https://bun.sh/docs
