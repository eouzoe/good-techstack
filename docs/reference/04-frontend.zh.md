# Frontend: TanStack Start

> depends_on: [01-api.md, 05-schema.md]
> tags: [frontend, react, ssr, tanstack]
> 最後更新：2026-07-10

## TanStack Start

**Version**: v1.168.27

### 2026 重要進展

- **SSR profiling**：throughput 提升 ~5.5x
- **React Server Components (RSC)**：非破壞性 v1.x 附加形式
- **Rsbuild first-class**：Vite 與 Rsbuild 都是官方一級公民

### Cloudflare Workers 整合

- `npm create cloudflare@latest -- --framework=tanstack-start`
- Binding 支援：D1/R2/KV/Queues/DO/Workflows/Cron
- Type generation：`wrangler types`

### Rsbuild 配置

```ts
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/rsbuild";

export default defineConfig({
  plugins: [pluginReact(), tanstackStart()],
});
```

## shadcn/ui (Base UI)

2026-07 起 Base UI 為 shadcn/ui 預設引擎（Radix 持續維護，可不必遷移）。

- Base UI 由 MUI 團隊維護，headless UI 原語庫
- API 不變，只換底層引擎

## 建置工具

- **Rspack 2.1.3**：Rust 原生 Webpack 相容 bundler
- **Rsbuild 2.1.5**：Rspack 上層建置工具
- **Rolldown**：VoidZero 的 Rust Rollup 替代，CF 收購後加速

## PWA → Expo Native（共存）

```
TanStack Start (Web/PWA)          Expo (iOS/Android)
         │                               │
         └──────── oRPC API ────────────┘
```

Expo 不需要改寫後端，共享同一套 oRPC contract + Hono backend。

## 官方文件

- TanStack Start: https://tanstack.com/start/latest
- shadcn/ui: https://ui.shadcn.com
- Rsbuild: https://rsbuild.rs
