# Infrastructure: Cloudflare + Nix

> depends_on: []
> tags: [cloudflare, nix, infra, deployment, dev-environment]
> 最後更新：2026-07-10

## Cloudflare Platform

### 開發→部屬流程

```bash
devenv shell -- bun run dev         # 本機開發
devenv shell -- bunx rsbuild build   # 前端建置
devenv shell -- bunx wrangler types  # binding TS 型別生成
devenv shell -- bunx wrangler deploy # 部署到 Workers
```

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

| 層       | 工具             | 範圍                                    |
| -------- | ---------------- | --------------------------------------- |
| 環境     | **devenv** (2.x) | Shell 啟動、套件、程序、腳本、git hooks |
| 套件鎖定 | **flake.nix**    | 可建置產出 (app, backend, frontend)     |
| JS 依賴  | **Bun**          | `node_modules`, `bun.lock`              |

Devenv 使用與 `flake.lock` 相同的 `nixpkgs` 鎖定版本，toolchain 版本一致。

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

| 維度        | 之前 (純 flake)                | 之後 (devenv + flake)          |
| ----------- | ------------------------------ | ------------------------------ |
| Shell 啟動  | _過去_ `nix develop` (3.8s)    | `devenv shell` (3.2s)          |
| Secret 管理 | `.env` (無 audit)              | `secretspec.toml` (audit log)  |
| Git hooks   | 手動 CI 才跑 oxlint            | Pre-commit 阻擋未格式化程式碼  |
| Agent 整合  | 無                             | MCP server + commands 自動配置 |
| CI Layer 1  | `oven-sh/setup-bun` + 裸 `bun` | 不變 (快速 PR gate)            |
| CI Layer 2  | —                              | `devenv test` (完整環境驗證)   |

### CI 用法

```yaml
- uses: cachix/install-nix-action@v27
- run: devenv shell -- bunx wrangler deploy
```

Layer 1 CI job（`check`）直接執行 lint / typecheck / test。
新的 Layer 2 CI job（`devenv-test`）執行 `devenv test` 進行完整環境驗證。

## SecretSpec

Secret 由 **SecretSpec** (v0.14.0) 管理，取代 `.env` 檔案。

```
secretspec.toml          # Key 定義 (提交到 git)
~/.config/secretspec/    # 加密值 (本機 only, 永不提交)
secretspec run -- <cmd>  # 注入 secret 到指令
secretspec audit         # 查看存取歷史
```

支援 provider：local keyring、dotenv、1Password、Vault、AWS Secrets Manager、GCP Secret Manager。

### 遷移

```bash
# 安裝
curl -fsSL https://secretspec.dev/install.sh | bash
secretspec init

# 設定 secretspec.toml 中定義的 key
secretspec secret set DATABASE_URL
secretspec secret set CLOUDFLARE_API_TOKEN

# 使用
secretspec run -- devenv shell
```

官方文件：https://secretspec.dev/quick-start/

## 官方文件

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare MCP: https://developers.cloudflare.com/agents/model-context-protocol/
- Nix flakes: https://nixos.wiki/wiki/Flakes
- Devenv: https://devenv.sh/reference/options/
- SecretSpec: https://secretspec.dev/quick-start/
