# Runtime: Bun

> depends_on: []
> tags: [runtime, javascript, typescript, dev-tool]
> 版本：1.3.14 stable (2026-07-06)
> 最後更新：2026-07-10

## 核心優勢

- 單一二進位：runtime + package manager + test runner + bundler
- JavaScriptCore 引擎，冷啟動 1.2ms（Node.js 45ms 的 37x）
- `export default app` 自動識別 fetch → `Bun.serve()`
- `--hot`：模組層級熱重載，保留 DB 連線
- Web Standards API 原生
- `Bun.password`：Argon2id hash, 硬體加速

## Bun 1.3.x 新功能

| 版本   | 新功能                                           |
| ------ | ------------------------------------------------ |
| 1.3.0  | `Bun.serve()` HTTP/3, Image API, warm install 7x |
| 1.3.10 | REPL Zig 重寫, Windows ARM64, TC39 decorator     |
| 1.3.12 | `Bun.WebView`, `Bun.cron()`, Markdown-to-ANSI    |

## Bun Rust 重寫（2026-07-08）

Jarred Sumner 宣布 Bun 核心從 Zig 重寫為 Rust，使用 Claude Fable 5 在 6 天內轉換 960k 行：

- 99.8% test pass rate
- Bun 2.0 將以 Rust 為基礎
- Use-after-free/double-free 從 runtime 移到 compile time
- 路線圖穩定性顯著加速

## Bun Workspace（Monorepo）

```
project/
├── apps/backend/       # Hono + oRPC + better-auth
├── apps/frontend/      # TanStack Start
├── packages/shared/    # 型別、contract、schema
├── package.json (workspaces: ["apps/*", "packages/*"])
├── bun.lock
```

不選 Turborepo/Nx：Bun workspace + `bun test` 已夠快，多加複雜度無收益。

## Bun + wrangler 相容性

| 場景                   | 結果                                       |
| ---------------------- | ------------------------------------------ |
| `bunx wrangler deploy` | Linux/Mac 可用。Windows 有問題 (bun#10464) |
| `bunx wrangler dev`    | 基本可用。DO hang 已修復 (bun#16240)       |
| CI/CD                  | 建議用 Node.js                             |

來源：bun#10464, bun#16240, workers-sdk#9699

## 官方文件

https://bun.sh/docs
