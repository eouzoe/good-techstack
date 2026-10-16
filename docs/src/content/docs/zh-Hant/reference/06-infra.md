---
title: "Infrastructure: Cloudflare + Nix"
sidebar:
  order: 7
---


> depends_on: []
> tags: [cloudflare, nix, infra, deployment, dev-environment]
> 最後更新：2026-07-10

## Cloudflare Platform

### 開發→部屬流程

```bash
devenv shell -- bun run dev              # 本機開發 (alchemy dev，bindings 從 env 綁定)
devenv shell -- bunx alchemy deploy      # 部屬（alchemy 內部執行 Vite build + 自動套用 D1 migrations）
```

`alchemy.run.ts` 取代 `wrangler.jsonc` 作為 IaC 層：所有 Cloudflare binding
（D1、KV、DO、Rate Limit、auth config）宣告為 `Effect` resource，透過
`InferEnv` 傳給 Worker。不再有獨立的 `vite build` script — build 在
`alchemy deploy` 內部執行。

### 服務與免費方案

| 服務      | 用途                 | 免費上限       |
| --------- | -------------------- | -------------- |
| Workers   | 後端執行 (Hono+oRPC) | 100k req/day   |
| D1        | SQLite serverless    | 5GB            |
| R2        | 物件儲存             | 10GB, 零出口費 |
| KV        | 快取                 | 100k read/day  |
| Queues    | 背景任務             | 1M op/month    |
| DO        | 強一致性狀態         | 1M req/month   |
| Email     | 郵件路由             | 100/day        |
| Turnstile | CAPTCHA              | 完全免費       |

### 平台鎖定？不存在的

- Hono → Web Standards, 到處可跑
- D1 → SQLite, dump→import
- R2 → S3 相容
- Drizzle → 換 DB 改一行

### Cloudflare MCP Servers

| Server           | URL                                            | 用途                     |
| ---------------- | ---------------------------------------------- | ------------------------ |
| API (Code Mode)  | `https://mcp.cloudflare.com/mcp`               | 完整 API 2500+ endpoints |
| Documentation    | `https://docs.mcp.cloudflare.com/mcp`          | 產品文件語義搜尋         |
| Workers Bindings | `https://bindings.mcp.cloudflare.com/mcp`      | D1/R2/KV/AI/DO 配置      |
| Workers Builds   | `https://builds.mcp.cloudflare.com/mcp`        | Builds 管理              |
| Observability    | `https://observability.mcp.cloudflare.com/mcp` | Logs 與 analytics        |

認證：Bearer Token (`~/.cloudflare/mcp-token`), 永不過期。

## Nix 開發環境

### 管理分工

| 層      | 工具                | 範圍                                                    |
| ------- | ------------------- | ------------------------------------------------------- |
| 環境    | **devenv** (2.2.1+) | Shell 啟動、套件、toolchain 鎖定、程序、腳本、git hooks |
| JS 依賴 | **Bun**             | `node_modules`, `bun.lock`                              |

devenv 是單一事實源：`devenv.nix` 宣告 toolchain，`devenv.lock` 鎖定這些工具
所來自的 `nixpkgs` commit。沒有獨立的 flake —— toolchain 版本完全存在
`devenv.lock`。

### devenv 功能

| 功能         | 配置                       | 用途                                                      |
| ------------ | -------------------------- | --------------------------------------------------------- |
| 套件         | `packages` in `devenv.nix` | bun, node, oxlint, oxfmt, wrangler, typescript, ts-ls     |
| 程序         | `processes`                | `devenv process up` 同時啟動 backend + frontend           |
| 腳本         | `scripts`                  | `lint`, `typecheck`, `test` 用 `devenv shell -- <script>` |
| 預提交 hooks | `git-hooks.hooks`          | oxlint + oxfmt + prettier 每次 `git commit` 自動執行      |
| Secret 管理  | `secretspec.enable`        | SecretSpec 完全取代 `.env`                                |
| Agent MCP    | `claude.code.mcpServers`   | Agent 查詢 devenv 套件/選項                               |
| Agent 指令   | `claude.code.commands`     | Agent 直接執行 devenv 腳本                                |

### 加入 devenv 前後

| 維度        | 之前 (純 flake)                | 之後 (devenv)                  |
| ----------- | ------------------------------ | ------------------------------ |
| Shell 啟動  | _過去_ `nix develop` (3.8s)    | `devenv shell` (3.2s)          |
| Secret 管理 | `.env` (無 audit)              | `secretspec.toml` (audit log, 23 providers, scopes) |
| Git hooks   | 手動 CI 才跑 oxlint            | Pre-commit 阻擋未格式化程式碼  |
| Agent 整合  | 無                             | MCP server + commands 自動配置 |
| CI Layer 1  | `oven-sh/setup-bun` + 裸 `bun` | 不變 (快速 PR gate)            |
| CI Layer 2  | —                              | `devenv test` (完整環境驗證)   |

### CI 用法

```yaml
- uses: cachix/install-nix-action@v27
- run: devenv shell -- secretspec run --scope deploy -- bunx alchemy deploy
```

Layer 1 CI job（`check`）直接執行 lint / typecheck / test。
新的 Layer 2 CI job（`devenv-test`）執行 `devenv test` 進行完整環境驗證。

## SecretSpec

Secret 由 **SecretSpec** 管理，取代 `.env` 檔案。

```
secretspec.toml          # 宣告 (提交到 git; 值存在 provider 中)
.env                     # 預設 dev provider (dotenv, gitignored)
secretspec run --scope runtime -- <cmd>  # 注入 scope 子集到指令
secretspec check         # 解析/生成缺少的 secret (BETTER_AUTH_SECRET 會自動生成)
secretspec audit         # 查看存取歷史 (預設開啟, 本機 JSONL)
```

alchemy 在 dev/deploy 時從 process env 讀取 `Config` bindings
（`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`、`USE_MOCKS`），因此透過
`secretspec run` 注入 scope 就是接線路徑 — 不再有 CF Vite plugin。

Provider：keyring、dotenv、env、1Password、Vault/OpenBao、age、SOPS、AWS/GCP/Azure secret managers 等 (0.17 共 23 個)。

### Scopes (SecretSpec 0.17+)

`[scopes.runtime]` 和 `[scopes.deploy]` 讓每個 process 只拿到它需要的 secret：

```bash
secretspec run --scope runtime -- bun run dev      # BETTER_AUTH_*
secretspec run --scope deploy -- bunx alchemy deploy   # CLOUDFLARE_* + BETTER_AUTH_*
```

`run --scope` 會從子環境移除不在 scope 內的 secret。

live 環境的 `BETTER_AUTH_URL` 需用 `production` profile 覆蓋（預設 profile 是 dev 的 `localhost:1337`），否則 better-auth 的 redirect 會指向本機：

```bash
secretspec set --profile production BETTER_AUTH_URL https://<your-domain>
secretspec run --scope deploy --profile production -- bunx alchemy deploy
```

`production` 繼承 default profile，只需覆寫 `BETTER_AUTH_URL`；此變更觸發 `[Website] update`（不動 D1/KV）。fresh live D1 只有 migrations 沒有資料，需先 seed（見 `docs/src/content/docs/en/guide/deployment.md` 的 `cli/seed-live.sql`）。

### 遷移

```bash
# 安裝 (只在非 devenv shell 需要 — devenv 2.2+ 已內建 CLI)
curl -fsSL https://secretspec.dev/install.sh | bash

# 設定 secretspec.toml 中定義的 key
secretspec set CLOUDFLARE_API_TOKEN
secretspec set CLOUDFLARE_ACCOUNT_ID

# 使用
secretspec run --scope runtime -- devenv shell
```

官方文件：https://secretspec.dev/quick-start/

## 官方文件

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare MCP: https://developers.cloudflare.com/agents/model-context-protocol/
- Devenv: https://devenv.sh/reference/options/
- SecretSpec: https://secretspec.dev/quick-start/
