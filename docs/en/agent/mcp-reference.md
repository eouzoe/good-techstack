# MCP Usage Map — Intent to MCP Server

> Purpose: when the agent receives a request, select the correct MCP server based on intent.
> Last updated: 2026-07-12

## Intent to MCP Server

| Intent / User says...                     | MCP Server                        | Method                                                                                                         | Example                                                      |
| ----------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Check Workers version / create a Worker   | `cloudflare` (API)                | `cloudflare_execute` + search OpenAPI spec → `cloudflare_search`                                               | "Create a new worker named hello-world"                      |
| Look up Cloudflare documentation          | `cloudflare-docs`                 | `cloudflare_docs`, `search_cloudflare_documentation`                                                           | "How does D1 backup work?"                                   |
| Create a D1 database / check KV namespace | `cloudflare-bindings`             | `d1_database_create`, `kv_namespaces_list`                                                                     | "Create a D1 database called my-db"                          |
| Debug production errors / view logs       | `cloudflare-observability`        | `query_worker_observability`, `observability_keys`                                                             | "Show me errors for worker api-proxy in the last 30 minutes" |
| Investigate build failure                 | `cloudflare-builds`               | `workers_builds_list_builds`, `workers_builds_get_build_logs`                                                  | "Why did my last deploy fail?"                               |
| Query devenv packages / options           | `devenv` (stdio)                  | `search_packages`, `search_options`                                                                            | "What's the bun version in this devenv?"                     |
| Manage devenv processes                   | `devenv` (stdio)                  | `list_processes`, `get_process_status`, `get_process_logs`, `restart_process`, `start_process`, `stop_process` | "Restart the backend process"                                |
| Look up third-party package documentation | `context7`                        | `resolve-library-id` + `query-docs`                                                                            | "How do I use TanStack Form with Zod?"                       |
| Search the web / crawl                    | `firecrawl`                       | `firecrawl_search`, `firecrawl_scrape`, `firecrawl_crawl`                                                      | "Search for the latest Bun release notes"                    |
| Browser testing / interaction             | `playwright` or `chrome-devtools` | `navigate_page`, `take_snapshot`, playwright tools                                                             | "Check if the login page loads correctly"                    |

## MCP Server dependency layers

```
L0 — Infrastructure queries
  ├── cloudflare-docs         → documentation (no side effects)
  ├── cloudflare              → API operations (side effects)
  ├── context7                → third-party package docs
  └── devenv                  → devenv package/option queries

L1 — Resource operations
  ├── cloudflare-bindings     → D1, R2, KV, DO resource management
  ├── cloudflare-builds       → build/deploy status
  └── cloudflare-observability → production monitoring and debugging

L2 — External interaction
  ├── firecrawl               → web search and crawling
  ├── playwright/chrome-devtools → browser automation
  └── bose-search             → fallback search engine
```

## Authentication

All Cloudflare MCP servers use Bearer Token:

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

The token lives at `~/.cloudflare/mcp-token` and never expires. Create one at Cloudflare Dashboard → API Tokens (permissions: Account → Workers:Edit).
