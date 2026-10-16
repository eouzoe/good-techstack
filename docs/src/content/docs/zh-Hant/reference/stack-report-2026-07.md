---
title: "gstack 技術棧報告 — 2026 年 7 月"
sidebar:
  order: 10
---


> 全域架構評估：邊緣 SSR + 型別全鏈閉環 + 零 DSL IaC

---

## 一、架構總覽

```
┌─────────────────────────────────────────────────────────┐
│                   使用者瀏覽器                              │
└──────────────────────┬──────────────────────────────────┘
                       │ 全球 330+ 節點中最接近的一個
┌──────────────────────▼──────────────────────────────────┐
│              Cloudflare Workers (邊緣 SSR)                 │
│                                                          │
│  ┌─TanStack Start─────────────────────────────────────┐  │
│  │  SSR 渲染 / Streaming / Server Functions            │  │
│  │  建置工具: Rsbuild 2 (Rust/Rspack)                   │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                 │
│  ┌─Hono + oRPC v2──────▼──────────────────────────────┐  │
│  │  /api/* → type-safe RPC (Valibot schema)            │  │
│  │  OpenAPI 3.1 自動生成                                │  │
│  │  錯誤處理 → OTEL span → ctx.waitUntil() flush        │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                 │
│  ┌─Bindings─────────────▼──────────────────────────────┐  │
│  │  DB(D1)  KV  R2  SESSION_DO(DO)  QUEUE  EMAIL       │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 二、核心技術棧逐項評估

### 2.1 TanStack Start + Rsbuild

| 面向 | 評估 |
|------|------|
| **定位** | React 全端 SSR 框架，Cloudflare Workers 官方推薦部署平台 |
| **建置** | Rsbuild 2（Rspack Rust 原生），比 Vite 生產建置快 3-5 倍 |
| **優勢** | 檔案系統路由 → `createFileRoute` 強型別、串流 SSR、Server Functions |
| **SSR 指標** | 全球中位數 TTFB 38ms（Workers 邊緣），Node.js 同區 120ms、跨洲 500ms |
| **版控** | `routeTree.gen.ts` 由 Rsbuild plugin 自動生成，無需手動維護 |

**為什麼不是 Next.js？** 2026 年 Next.js 在 Cloudflare 上仍需透過 OpenNext 轉接層，架構複雜度增加、型別鏈條斷裂。TanStack Start 原生支援 Workers，無轉接層，型別直通。Cloudflare 已是 TanStack Start 的**官方合作夥伴**。

---

### 2.2 Hono + oRPC v2

| 面向 | 評估 |
|------|------|
| **RPC 框架** | oRPC v2（beta.22），非 tRPC 亦非純 Hono |
| **型別安全** | 端到端輸入/輸出/錯誤/檔案/串流全型別安全 |
| **Schema 庫** | **Valibot**（非 Zod）— 模組化、tree-shakeable、bundle 更小 |
| **OpenAPI** | ✅ 原生支援 — tRPC 做不到的事。產生 OpenAPI 3.1 spec 給外部消費者 |
| **Bundle** | oRPC ~5KB（tRPC ~30KB、Hono ~14KB） |
| **唯一優勢** | Contract-first 與 Procedure-first 雙模式並存 |
| **CF 獨佔** | Cloudflare WebSocket Hibernation 原生支援（tRPC 與 Hono RPC 皆無） |

**為什麼是 oRPC 而非 tRPC 或純 Hono？**

- tRPC 綁死 Zod，無法產出 OpenAPI spec，外部消費者（mobile/SDK 生成）困難
- 純 Hono 無端到端型別安全，需手寫 client type
- oRPC 同時滿足兩者：內部 monorepo 型別閉環 + 外部 OpenAPI 相容

---

### 2.3 better-auth

| 面向 | 評估 |
|------|------|
| **定位** | 開箱即用的認證方案（email, OAuth, SSO, 魔法鏈接, passkey） |
| **資料庫** | D1（Drizzle adapter），持久化儲存 user/session/account |
| **Session 快取** | **KV** 作為 secondaryStorage（讀取 <1ms） |
| **Rate Limit** | **SessionDO**（Durable Object）強一致性速率限制 |
| **Cookie 快取** | ❌ 因上游 bug #4203 關閉（cache 到期後不回源 secondaryStorage） |
| **TTL 保護** | KV 60 秒最小 TTL 強制 clamp—`Math.max(ttl, 60)` |
| **密碼學** | WebCrypto（Cloudflare V8 原生），無 Node polyfill |

**全局影響**：Session 讀取走 KV（快）、Rate Limit 走 DO（準確）、持久層走 D1（穩）。三層分工明確。

---

### 2.4 D1 + Drizzle ORM（雙啟動）

```
┌──────────────────────────────────────────────────────┐
│                     應用程式碼                           │
│  import { getDB } from "./db/index"                  │
└──────────────┬───────────────────────┬───────────────┘
               │                       │
     ┌─────────▼─────────┐   ┌────────▼────────┐
     │  db/index.ts       │   │  db/local.ts     │
     │  D1 (Worker 執行)   │   │  bun:sqlite (CLI) │
     │  透過 env.DB 注入   │   │  動態 import()    │
     └───────────────────┘   └─────────────────┘
               │                       │
     ┌─────────▼─────────┐   ┌────────▼────────┐
     │  Cloudflare D1     │   │  本地 SQLite 檔案  │
     │  自動讀取複寫       │   │  WAL mode         │
     └───────────────────┘   └─────────────────┘
```

**為什麼這樣設計？**

- Workers 無法使用 `bun:sqlite`（Node API 不可用）
- CLI 腳本（seed/migrate）不該走 wrangler D1 API（慢）
- `import()` 確保 `bun:sqlite` 程式碼**永遠不進入 Worker bundle**

---

### 2.5 alchemy IaC（v0.93.12）

| 面向 | 評估 |
|------|------|
| **定位** | TypeScript 原生 IaC，資源 = async function |
| **對比 Terraform** | 無 DSL、無 HCL、無計畫/套用環節 |
| **對比 Pulumi** | 無 state backend 依賴、無 SDK 抽象層 |
| **對比 SST v3** | Cloudflare 優先（SST 是 AWS 優先） |
| **狀態檔案** | 本地 JSON，可 commit、可手動編輯 |
| **整合** | `TanStackStart`、`D1Database`、`DurableObjectNamespace` 等 |
| **2026 趨勢** | Alchemy 已是 Cloudflare-first TypeScript 專案的預設 IaC |

**全局影響**：wrangler.jsonc 從手寫配置 → 從 TypeScript 自動生成。一條型別鏈從資料庫名稱貫穿到 `env.DB` 的型別推斷。

---

### 2.6 型別鏈完整性

```
Valibot Schema ──→ oRPC Contract ──→ oRPC Procedure ──→ OpenAPI Spec
     │                                                      │
     ├── Drizzle Schema ──→ D1 Query ──→ 型別安全的 SQL      │
     │                                                      │
     ├── Queue Schema ──→ message.body 強制型別              │
     │                                                      │
     ├── DO Type ──→ DurableObjectStub<InstanceType<TSessionDO>> │
     │                                                      │
     └── Error Schema ──→ FlattenedIssues ──→ 前端 i18n 映射  │
                                                           │
              ┌────────────────────────────────────────────┘
              ▼
        TanStack Start SSR
        （同一個 Valibot schema 在前後端共用）
```

**每個型別斷裂點都被封閉：**

| 斷裂點 | 類型 | 解決方案 |
|--------|------|----------|
| DO 跨沙盒 | RPC 型別蒸發 | `TSessionDO = typeof SessionDO` + `DurableObjectStub<InstanceType<...>>` |
| Queue 消息 | body: unknown | `v.parse(QueuePayloadSchema, message.body)` |
| R2 Metadata | 字串自由對 | `R2Metadata` interface |
| 環境變數 | 洩漏至前端 | `source.envPrefix: ["PUBLIC_"]` |
| 驗證錯誤 | 字串難 i18n | `flattenValiError()` → 物件路徑 → 前端翻譯字典 |

---

### 2.7 品質工具鏈

| 工具 | 版本 | 角色 | 速度 |
|------|------|------|------|
| **oxlint** | 1.76 | Linter（取代 ESLint） | 50-100x 快於 ESLint |
| **oxfmt** | 0.46 | Formatter（取代 Prettier） | Rust 原生，毫秒級 |
| **TypeScript** | 7.0 | 型別檢查 | `erasableSyntaxOnly` 模式 |
| **Vitest** | 4.1 | 測試框架（相容 Workers pool） | 300ms 全測試 |
| **wrangler** | 4.115 | CF 部署 + 型別生成 | |

**oxlint 規則嚴格度**：所有類別（correctness、suspicious、pedantic、perf、style）皆為 error，nursery 為 warn。`no-explicit-any` 強制 `fixToUnknown`。

---

## 三、新增技術的戰略價值

### 3.1 alchemy：最後的型別斷層被封閉

過去 IaC 存在「型別外」的配置 — wrangler.toml 的 binding 名稱、資料庫 UUID、R2 儲存桶名稱。這些字串一旦輸入錯誤，只能在執行期發現。alchemy 讓這些配置變成 TypeScript 型別，IDE 自動完成、編譯期檢查。

實際影響：`env.DB` 的型別不再靠手寫 `interface Env { DB: D1Database }`，而是從 `infrastructure.ts` 的綁定宣告自動推斷。

### 3.2 SessionDO（Durable Object）為什麼不直接取代 KV？

最初計畫是把 better-auth 的 session 全部放進 DO。研究後發現：
- better-auth 的 `secondaryStorage` 介面是 KV-like（`get/set/delete` string）
- 每次讀 session 都走 DO stub 會增加 5-10ms 延遲（DO round-trip）
- KV 讀取 <1ms，session 是讀取密集型工作負載

**最終分工**：
- KV → session 讀寫（快，最終一致性可接受）
- DO → rate limit 計數（強一致性必要，寫入頻率低）
- D1 → 持久層（source of truth）

### 3.3 DB Seed 快取：為什麼重要

`--persist-to=:memory:` 意味著每次 `wrangler dev` 重啟資料就消失。開發時每次 HMR 或重啟都要重新 seed 是痛苦的。快取機制：
1. 第一次 seed → 寫入 `gstack-dev.db` + 複製到 `.dev.snapshot.db`
2. 後續重啟 → `cp .dev.snapshot.db gstack-dev.db`（毫秒級）
3. `--force` 重新 seed

---

## 四、技術棧全局評分

| 維度 | 評分 | 說明 |
|------|------|------|
| **型別完整性** | ⭐⭐⭐⭐⭐ | Valibot → oRPC → Drizzle → DO → Queue 全鏈閉環 |
| **邊緣效能** | ⭐⭐⭐⭐⭐ | 全球 330+ 節點 SSR，中位數 TTFB 38ms |
| **開發體驗** | ⭐⭐⭐⭐ | Rsbuild HMR、codegen 自動路由、devenv 一鍵啟動 |
| **部署彈性** | ⭐⭐⭐⭐⭐ | alchemy IaC + wrangler，本地到生產一致 |
| **生態成熟度** | ⭐⭐⭐⭐ | TanStack 快速成長中，不如 Next.js 成熟但無供應商鎖定 |
| **安全性** | ⭐⭐⭐⭐⭐ | envPrefix 防火牆、WebCrypto、OTEL 錯誤追蹤 |
| **可測試性** | ⭐⭐⭐⭐ | Vitest + Workers pool，但 Worker 整合測試需完善 |
| **學習曲線** | ⭐⭐⭐ | 技術棧選擇較多（oRPC vs tRPC、Rsbuild vs Vite），需理解全域架構 |

---

## 五、總結

2026 年的 TypeScript 全端生態正在經歷一場重構：

**舊世界**：Next.js + Vercel + tRPC + Zod → 供應商鎖定、型別鏈不完整、OpenAPI 輸出困難

**新世界**：TanStack Start + Cloudflare Workers + oRPC + Valibot + alchemy → 邊緣原生、型別全鏈閉環、零 DSL IaC

gstack 在這個新世界中選擇的路線：

```
邊緣 SSR          TanStack Start + Rsbuild 2（Rust 原生建置）
API 層            Hono + oRPC v2（Valibot 合同優先，OpenAPI 輸出）
認證              better-auth（KV 快取 + DO 速率限制 + D1 持久層）
資料庫            Drizzle ORM + D1（雙啟動：本地 bun:sqlite / 雲端 D1）
基礎設施          alchemy（TypeScript 原生 IaC，TanStackStart 整合）
程式碼品質         oxlint（strict）+ oxfmt（Rust 原生）
開發環境          devenv 2.x + SecretSpec + just
版本控制          jj（Jujutsu）colocated with Git
```

**這條路線的核心主張**：型別鏈不應該在框架之間斷裂。從 Valibot schema 到 D1 query 到 OpenAPI spec 到 DO RPC stub，全部在同一個型別系統內貫穿。

---

*報告日期：2026-07-31*
*來源：gstack 程式碼庫 + 官方文檔 + 2026 年 7 月第三方技術評測*
