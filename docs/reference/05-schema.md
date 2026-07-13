# Schema: Zod v4

> depends_on: []
> tags: [schema, validation, types, zod]
> Last updated: 2026-07-10

## Role: not a schema library, the shared language of the type chain

Zod is the intermediate language for the entire type-safe chain:

```
packages/contract/ → user.zod.ts (single source of truth)
  ├── oRPC: .input(UserCreate).output(UserResponse)
  ├── Drizzle: z.infer<> maps to DB row type
  ├── TanStack Form: zodResolver(UserCreate)
  └── better-auth: plugin config is also Zod
```

**Key**: `z.input<>` / `z.output<>` / `z.infer<>` derive automatically. No codegen.

### Comparison

| Library    | Bundle             | oRPC        | TanStack Form | Agent-friendly     | Bun |
| ---------- | ------------------ | ----------- | ------------- | ------------------ | --- |
| **Zod v4** | 5.9kb (Mini 2.1kb) | First-class | Native        | Most training data | Yes |
| Valibot    | 1-3kb              | Adapter     | Yes           | Partial            | Yes |
| ArkType    | 3-5kb              | No          | No            | Partial            | Yes |

Zod v4 performance (official benchmark, node v22 arm64):

| Operation             | v3    | v4     | Speed-up |
| --------------------- | ----- | ------ | :------: |
| `.parse()` string     | 363µs | 24.7µs |  14.7x   |
| `.safeParse()` object | 805µs | 124µs  |   6.5x   |

### Zod Mini (frontend optimisation)

```ts
import * as z from "zod/mini"; // 2.1kb gzip vs 5.9kb
```

## Zod v4 breaking changes

| Pattern                     | v3                                            | v4                                               |
| --------------------------- | --------------------------------------------- | ------------------------------------------------ |
| `.refine()` type narrowing  | `refine((val): val is T => ...)` narrows type | No longer narrows                                |
| `.refine()` second argument | Function for custom message                   | Static options only; use superRefine for dynamic |
| `.transform()`              | Returns original type                         | Returns ZodPipe, opaque                          |

### Environment variable validation

```ts
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(8080),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});
```

## Official docs

https://zod.dev
