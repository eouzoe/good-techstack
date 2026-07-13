# Frontend: TanStack Start

> depends_on: [01-api.md, 05-schema.md]
> tags: [frontend, react, ssr, tanstack]
> Last updated: 2026-07-10

## TanStack Start

**Version**: v1.168.27

### SSR profiling

Throughput improved ~5.5x in 2026.

### React Server Components (RSC)

Non-breaking, additive to v1.x.

### Cloudflare Workers integration

- `npm create cloudflare@latest -- --framework=tanstack-start`
- Binding support: D1, R2, KV, Queues, DO, Workflows, Cron
- Type generation: `wrangler types`

### Rsbuild configuration

```ts
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/rsbuild";

export default defineConfig({
  plugins: [pluginReact(), tanstackStart()],
});
```

## shadcn/ui (Base UI)

Base UI is now the default engine for shadcn/ui (Radix is still maintained, migration is optional).

- Base UI is maintained by the MUI team, a headless UI primitives library
- API is unchanged, only the underlying engine changes

## Build tools

- **Rspack 2.1.3**: Rust-native Webpack-compatible bundler
- **Rsbuild 2.1.5**: Build tool on top of Rspack

## Expo native (coexistence)

```
TanStack Start (Web/PWA)          Expo (iOS/Android)
         │                               │
         └──────── oRPC API ────────────┘
```

Expo does not require rewriting the backend. It shares the same oRPC contracts and Hono backend.

## Official docs

- TanStack Start: https://tanstack.com/start/latest
- shadcn/ui: https://ui.shadcn.com
- Rsbuild: https://rsbuild.rs
