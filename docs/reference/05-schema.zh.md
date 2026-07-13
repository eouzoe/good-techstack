# Schema: Zod v4

> depends_on: []
> tags: [schema, validation, types, zod]
> 版本：v4.4+
> 最後更新：2026-07-10

## 角色：不是 schema 庫，是型別鏈的共用語言

Zod 是整條型別安全鏈的中間語言：

```
packages/contract/ → user.zod.ts (唯一 source of truth)
  ├── oRPC: .input(UserCreate).output(UserResponse)
  ├── Drizzle: z.infer<> 對應 DB row type
  ├── TanStack Form: zodResolver(UserCreate)
  └── better-auth: plugin config 也是 Zod
```

**關鍵**：`z.input<>` / `z.output<>` / `z.infer<>` 自動推導，不須 codegen。

### 比較

| 庫         | bundle             | oRPC        | TanStack Form | Agent 友善      | Bun |
| ---------- | ------------------ | ----------- | ------------- | --------------- | --- |
| **Zod v4** | 5.9kb (Mini 2.1kb) | ✅ 第一公民 | ✅ 原生       | ✅ 最多訓練資料 | ✅  |
| Valibot    | 1-3kb              | ⚠️ adapter  | ✅            | ⚠️              | ✅  |
| ArkType    | 3-5kb              | ❌          | ❌            | ⚠️              | ✅  |

Zod v4 效能（官方 benchmark, node v22 arm64）：

| 操作                  | v3    | v4     |   加速    |
| --------------------- | ----- | ------ | :-------: |
| `.parse()` string     | 363µs | 24.7µs | **14.7x** |
| `.safeParse()` object | 805µs | 124µs  | **6.5x**  |

### Zod Mini (前端優化)

```ts
import * as z from "zod/mini"; // 2.1kb gzip vs 5.9kb
```

## Zod v4 Breaking Changes

| 模式                       | v3                                        | v4                                      |
| -------------------------- | ----------------------------------------- | --------------------------------------- |
| `.refine()` type narrowing | `refine((val): val is T => ...)` 縮窄型別 | 不再縮窄                                |
| `.refine()` 第二參數       | 可傳函式客製訊息                          | 僅靜態 options 物件；動態用 superRefine |
| `.superRefine()`           | `ctx.path` 存在                           | `ctx.path` 已移除，用 `ctx.issue`       |
| `ZodEffects`               | wrapper class                             | 不存在；refinement = schema 內部 checks |
| `.transform()`             | 回傳原始型別                              | 回傳 `ZodPipe`，opaque                  |

### 環境變數驗證慣例

```ts
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(8080),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});
```

## 官方文件

https://zod.dev
