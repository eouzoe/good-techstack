# 測試策略：7 層分層矩陣

> depends_on: [00-runtime.md, 06-infra.md]
> tags: [test, quality, ci, verification]
> 核對表見：`docs/guide/testing.md`
> 最後更新：2026-07-10

## 原則

開發迴圈用最快工具、CI 閘門用最逼真工具。

```bash
# 日常開發（毫秒級回饋）
devenv shell -- bun test                    # 全部單元 + 合約 + 屬性
devenv shell -- bun test --watch            # TDD 模式
devenv shell -- bun test --coverage         # 涵蓋率

# CI 閘門（workerd 正確性）
devenv shell -- vitest run                  # vitest-pool-workers 整合測試

# 部屬前
devenv shell -- bunx playwright test        # E2E（對 wrangler dev）

# 生產監控
devenv shell -- bunx wrangler tail          # 即時錯誤監控
```

## 測試層級

|   層    | 工具                            | Runtime    |  速度   |   CI?   | 測試什麼                            |
| :-----: | ------------------------------- | ---------- | :-----: | :-----: | ----------------------------------- |
| 1. 煙霧 | `bun test`                      | Bun JSC    |  <50ms  |   ✅    | Schema 編譯、binding 連通、app boot |
| 2. 單元 | `bun test`                      | Bun JSC    | <200ms  |   ✅    | Pure function、business logic       |
| 3. 合約 | `bun test`                      | Bun JSC    | <500ms  |   ✅    | oRPC contract 一致性                |
| 4. 屬性 | `@fast-check/vitest`            | Bun JSC    |   <1s   |   ✅    | Fuzzing edge case                   |
| 5. 整合 | `vitest-pool-workers`           | workerd    |  5-30s  |   ✅    | D1/R2/KV/DO binding                 |
| 6. E2E  | `@playwright/test`              | 真實瀏覽器 | 30-120s | ❌ 手動 | 黃金路徑、auth、security            |
| 7. 生產 | `wrangler tail` + Observability | 生產       |   N/A   |   ❌    | Error rate、p99                     |

## CI 閘門矩陣

```
PR → just lint          (oxlint --type-aware)
   → just typecheck     (tsc --noEmit)
   → just test          (bun test: unit | contract | property)
   → devenv shell -- vitest run (integration)
   → PASS ✅
```

## oxlint + oxfmt

| 工具   | 版本   | 角色                    | 效能           |
| ------ | ------ | ----------------------- | -------------- |
| oxlint | 1.73.0 | Rust linter, 840+ rules | 50-100x ESLint |
| oxfmt  | 0.58.0 | Rust formatter          | 30x Prettier   |

Type-aware linting via `tsgolint` (Go-based TS type checker): `oxlint --type-aware`
支援 59/61 typescript-eslint type-aware rules。

## 測試涵蓋率目標

| 層         | 目標                           | 工具                |
| ---------- | ------------------------------ | ------------------- |
| API route  | 100%                           | bun test --coverage |
| DB query   | 每 query 1 整合                | vitest run          |
| Zod schema | 每 schema 1+1 (smoke+property) | bun test            |
| Auth flow  | 3 (register/login/logout)      | playwright          |

## E2E 注意事項 (CF Workers + Playwright)

- target `wrangler dev`，非 `vite dev` (CSP + Vite HMR 衝突)
- 加 `--persist-to .wrangler/state` (否則 D1 SQLite 為空)
- WebAuthn virtual authenticator 而非 `DEV_BYPASS_USER_ID`
- 第三方 OAuth: seed session row + inject cookie

## 官方文件

- Vitest: https://vitest.dev
- Playwright: https://playwright.dev
- fast-check: https://fast-check.dev
- CF vitest-pool-workers: https://developers.cloudflare.com/workers/testing/vitest-integration/
- oxc: https://oxc.rs/docs/guide/usage.html
