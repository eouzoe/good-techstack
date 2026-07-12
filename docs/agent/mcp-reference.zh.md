# MCP Usage Map — 意圖 → MCP Server 對照

> 用途：當 agent 收到 user 請求時，根據意圖選擇對應的 MCP server。
> 最後更新：2026-07-12

## 意圖 → MCP Server 映射

| 意圖 / 使用者說...               | MCP Server                        | 工具 / 方法                                                                                                    | 範例                                                |
| -------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 查 Workers 最新版本／建立 Worker | `cloudflare` (API)                | `cloudflare_execute` + 搜尋 OpenAPI spec → `cloudflare_search`                                                 | "Create a new worker named hello-world"             |
| 查 Cloudflare 產品文件           | `cloudflare-docs`                 | `cloudflare_docs` + `search_cloudflare_documentation`                                                          | "How does D1 backup work?"                          |
| 建 D1 資料庫／查 KV namespace    | `cloudflare-bindings`             | `d1_database_create`, `kv_namespaces_list` 等                                                                  | "Create a D1 database called my-db"                 |
| 除錯生產錯誤／看 logs            | `cloudflare-observability`        | `query_worker_observability`, `observability_keys`                                                             | "Show me errors for worker api-proxy in last 30min" |
| 排查 Build 失敗                  | `cloudflare-builds`               | `workers_builds_list_builds`, `workers_builds_get_build_logs`                                                  | "Why did my last deploy fail?"                      |
| 查 devenv 套件／選項             | `devenv` (stdio)                  | `search_packages`, `search_options`                                                                            | "What's the bun version in this devenv?"            |
| 管理 devenv 進程                 | `devenv` (stdio)                  | `list_processes`, `get_process_status`, `get_process_logs`, `restart_process`, `start_process`, `stop_process` | "Restart the backend process"                       |
| 查 framework/package 文件        | `context7`                        | `resolve-library-id` + `query-docs`                                                                            | "How do I use TanStack Form with Zod?"              |
| 搜尋網路／爬蟲                   | `firecrawl`                       | `firecrawl_search`, `firecrawl_scrape`, `firecrawl_crawl`                                                      | "Search for latest Bun release notes"               |
| 瀏覽器測試／互動                 | `playwright` or `chrome-devtools` | `navigate_page`, `take_snapshot`, playwright tools                                                             | "Check if the login page loads correctly"           |

## MCP Server 依賴層級

```
L0 — 基礎設施查詢
  ├── cloudflare-docs    → 文件查詢（無副作用）
  ├── cloudflare          → API 操作（有副作用）
  ├── context7            → 第三方套件文件
  └── devenv              → devenv 套件/選項查詢

L1 — 資源操作
  ├── cloudflare-bindings → D1/R2/KV/DO 等資源管理
  ├── cloudflare-builds   → Build/deploy 狀態
  └── cloudflare-observability → 生產監控與除錯

L2 — 外部互動
  ├── firecrawl            → 網路搜尋與爬蟲
  ├── playwright/chrome-devtools → 瀏覽器自動化
  └── bose-search          → 備用搜尋引擎
```

## 認證配置

所有 Cloudflare MCP servers 使用 Bearer Token：

```json
{
  "mcp": {
    "cloudflare": {
      "type": "remote",
      "url": "https://mcp.cloudflare.com/mcp",
      "oauth": false,
      "headers": {
        "Authorization": "Bearer {file:~/.cloudflare/mcp-token}"
      }
    }
  }
}
```

Token 存在 `~/.cloudflare/mcp-token`，永不過期。從 Cloudflare Dashboard → API Tokens 建立（權限：Account > Workers:Edit）。
