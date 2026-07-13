# API: Hono + oRPC

> depends_on: [00-runtime.md, 05-schema.md]
> tags: [api, http, rpc, workers]
> 最後更新：2026-07-10

## Hono — Web Standards HTTP 框架

**Version**: 4.12.28 stable

### Hono + Bun 整合

Bun 引擎自動偵測 default export 的 `fetch` 屬性，自動 `Bun.serve()`：

```ts
import { Hono } from "hono";
const app = new Hono();
app.get("/", (c) => c.text("Hello"));
export default app;
```

RegExpRouter × JSC 共鳴：所有路由編譯成單一正則，JSC regex 顯著優於 V8。

### 路由器層級

| Router       | 速度 | 場景                 |
| ------------ | :--: | -------------------- |
| RegExpRouter | 最快 | 固定路由集合         |
| LinearRouter | 次快 | 每個請求初始化 (ISR) |
| SmartRouter  | 自動 | 預設，自動選擇最佳   |

## oRPC — Contract-first RPC

**Version**: stable v1.14.7 / v2.0.0-beta.15 (dual-track)

### 為何選 oRPC 非 Hono RPC / tRPC

- 型別安全範圍：Request/Response/Error/Middleware 全鏈（Hono RPC 僅 Req/Res）
- Contract-first：先定義 contract 再實作
- Framework 整合：TanStack Query / Pinia Colada 原生
- vs tRPC：型別檢查 1.6x 快、runtime 2.8x 快、bundle 2x 小
- 多運行時：CF Workers / Deno / Bun / Node

### 整合範例

```ts
const getPost = os
  .use(dbProvider)
  .use(requireAuth)
  .route({ method: "GET", path: "/post/{id}" })
  .input(z.object({ id: z.string() }))
  .errors({ NOT_FOUND: { data: z.object({ id: z.string() }) } })
  .handler(async ({ input, context }) => {
    // context.user 自動型別推斷
  });
```

## 官方文件

- Hono: https://hono.dev
- oRPC: https://orpc.dev
