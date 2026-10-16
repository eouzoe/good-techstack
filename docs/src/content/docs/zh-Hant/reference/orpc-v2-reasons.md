---
title: 'oRPC v2 — 使用理由與實作清單'
sidebar:
  order: 9
---

> 更新日期：2026-07-31
> 當前版本：`2.0.0-beta.23`（2026-07-30 發布）

---

## 為什麼選 oRPC v2（相較於 tRPC / 純 Hono RPC）

### 1. OpenAPI 原生輸出

tRPC 無法產出 OpenAPI spec — 需要外部工具手刻。oRPC 內建 `OpenAPIGenerator`，一條 API 定義同時滿足內部 monorepo 型別閉環和外部消費者（mobile SDK 生成、第三方整合）。

### 2. Schema 自由 — 不綁死 Zod

oRPC 支援所有 Standard Schema 實作（Valibot、Zod、ArkType）。tRPC 直到 v11 才開始鬆綁，但生態仍以 Zod 為主。

### 3. Bundle 最小

oRPC ~5KB（min+gzip），tRPC ~30KB，Hono ~14KB。對 Workers 邊緣運算，每 KB 都影響冷啟動時間。

### 4. Contract-First + Procedure-First 雙模式

可以在共享 package 中定義 contract（純 schema），在不同服務中以不同方式實作。tRPC 沒有 contract 層。

### 5. Cloudflare WebSocket Hibernation 原生支援

唯一原生支援 CF Hibernation 的 RPC 框架（v2 專屬）。適合聊天、即時通知、協作編輯。

### 6. Durable Iterator（DO 事件串流）

基於 Durable Objects 的持久化事件串流，支援斷線重連 + `lastEventId` 自動恢復。tRPC 和純 Hono 都沒有。

### 7. 原生型別支援

`Date`、`BigInt`、`File`、`Blob`、`ReadableStream`、`URL` — 不需要自訂序列化器。

### 8. SSE + Streaming 全型別安全

`AsyncIteratorObject` schema 讓即時資料流也有完整型別定義。客戶端可強型別消費。

### 9. Lazy Router

只在呼叫時載入對應的 procedure code，減少冷啟動 bundle 大小。

### 10. Server Actions 相容

可作為 TanStack Start/Next.js Server Actions 的後端。Server Function 內部直接呼叫型別安全的 oRPC client。

### 11. First-Class OpenTelemetry

`@orpc/otel` 套件提供原生 OTEL 整合，span 自動串接請求和程序。

### 12. TanStack Query 整合

`@orpc/tanstack-query` 提供 React Query hooks，前端直接獲得型別安全的資料查詢 + cache + mutation。

### 13. Interceptor 架構

類似 Hono middleware 但專為 RPC 設計。支援 logging、retry、auth、batching、transport 自訂。

---

## gstack 已實作項目

| 功能                  | 狀態    | 位置                                                               |
| --------------------- | ------- | ------------------------------------------------------------------ |
| Contract-First        | ✅      | `src/shared/contracts/index.ts`                                    |
| Valibot 整合          | ✅      | `@orpc/valibot@2.0.0-beta.23`                                      |
| TanStack Start 整合   | ✅      | `src/entry-server.tsx`                                             |
| Lazy Router           | ✅      | `src/routers/_app.ts`（codegen 自動生成 `os.*.lazy()`）            |
| SSE / Streaming       | ✅      | `src/procedures/info/events.ts`（`asyncIteratorObject`）           |
| Durable Iterator      | ✅      | `src/server/do-events.ts`（`DurablePublisherObject` + resume）     |
| WebSocket Hibernation | ✅      | `@orpc/cloudflare` 的 `DurablePublisherObject`（原生 hibernation） |
| `@orpc/cloudflare`    | ✅      | `@orpc/cloudflare@2.0.0-beta.23`（含 `CloudflareRateLimiter`）     |
| Event auto-recovery   | ✅      | `resume: { enabled: true, seconds: 300 }`（lastEventId）           |
| OpenTelemetry         | 🔲 待辦 | `@orpc/otel`                                                       |
| TanStack Query 整合   | 🔲 待辦 | `@orpc/tanstack-query`                                             |
| Server Actions        | 🔲 待辦 |                                                                    |
| Smart Coercion        | 🔲 待辦 | `@orpc/json-schema`                                                |

---

## 參考資料

- [oRPC v2 官方文檔](https://v2.orpc.dev/)
- [oRPC GitHub](https://github.com/middleapi/orpc)
- [Cloudflare Workers 整合指南](https://v2.orpc.dev/docs/adapters/cloudflare)
- [WebSocket Adapters](https://v2.orpc.dev/docs/adapters/websocket)
- [AsyncIteratorObject (SSE)](https://v2.orpc.dev/docs/async-iterator-object)
- [Durable Iterator](https://v2.orpc.dev/docs/integrations/durable-iterator)
- [Valibot Integration](https://v2.orpc.dev/docs/integrations/valibot)
