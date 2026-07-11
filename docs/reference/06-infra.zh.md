# Infrastructure: Cloudflare + Nix

> depends_on: []
> tags: [cloudflare, nix, infra, deployment, dev-environment]
> 最後更新：2026-07-10

## Cloudflare Platform

### 開發→部屬流程

```bash
bun run dev               # 本機開發
bunx rsbuild build        # 前端建置
bunx wrangler types       # binding TS 型別生成
bunx wrangler deploy      # 部署到 Workers
```

### 服務與免費方案

| 服務 | 用途 | 免費上限 |
|------|------|----------|
| Workers | 後端執行 (Hono+oRPC) | 100k req/day |
| D1 | SQLite serverless | 5GB |
| R2 | 物件儲存 | 10GB, 零出口費 |
| KV | 快取 | 100k read/day |
| Queues | 背景任務 | 1M op/month |
| DO | 強一致性狀態 | 1M req/month |
| Email | 郵件路由 | 100/day |
| Turnstile | CAPTCHA | 完全免費 |

### 平台鎖定？不存在的

- Hono → Web Standards, 到處可跑
- D1 → SQLite, dump→import
- R2 → S3 相容
- Drizzle → 換 DB 改一行

### Cloudflare MCP Servers

| Server | URL | 用途 |
|--------|-----|------|
| API (Code Mode) | `https://mcp.cloudflare.com/mcp` | 完整 API 2500+ endpoints |
| Documentation | `https://docs.mcp.cloudflare.com/mcp` | 產品文件語義搜尋 |
| Workers Bindings | `https://bindings.mcp.cloudflare.com/mcp` | D1/R2/KV/AI/DO 配置 |
| Workers Builds | `https://builds.mcp.cloudflare.com/mcp` | Builds 管理 |
| Observability | `https://observability.mcp.cloudflare.com/mcp` | Logs 與 analytics |

認證：Bearer Token (`~/.cloudflare/mcp-token`), 永不過期。

## Nix 開發環境

### flake.nix 設計邊界

**Bun 管 JS 依賴樹，Nix 管 Bun 以外的 toolchain。**

### shell 分工

- `devShells.default`：Bun 1.3.14 + Node 22 + oxlint + oxfmt + workerd + wrangler
- `devShells.ci`：Node 22 + wrangler (只夠 CI deploy)

### 加入 Nix 前後

| 維度 | 加入前 | 加入後 |
|------|--------|--------|
| 環境一致性 | README + 默契, 新機 30 分手裝 | `nix develop` 一鍵鎖版 |
| 雙 runtime | 手維兩套 | default/ci 乾淨切分 |
| toolchain 漂移 | 版本不同步 | 全員同版, flake.lock 鎖 |
| 快取 | 各自下載 | nix store 共用 binary |

### CI 用法

```yaml
- uses: cachix/install-nix-action@v27
- run: nix develop .#ci --command npx wrangler deploy
```

## 官方文件

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare MCP: https://developers.cloudflare.com/agents/model-context-protocol/
- Nix flakes: https://nixos.wiki/wiki/Flakes
