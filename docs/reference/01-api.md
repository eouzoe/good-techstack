# API: Hono + oRPC

> depends_on: [00-runtime.md, 05-schema.md]
> tags: [api, http, rpc, workers]
> Last updated: 2026-07-10

## Hono — Web Standards HTTP framework

**Version**: 4.12.28 stable

Bun detects the `fetch` export automatically and calls `Bun.serve()`:

```ts
import { Hono } from "hono";
const app = new Hono();
app.get("/", (c) => c.text("Hello"));
export default app;
```

### Routers

| Router       |  Speed  | Use case                         |
| ------------ | :-----: | -------------------------------- |
| RegExpRouter | Fastest | Static route set                 |
| LinearRouter | Second  | Per-request initialisation (ISR) |
| SmartRouter  |  Auto   | Default, picks the best          |

## oRPC — Contract-first RPC

**Version**: stable v1.14.7 / v2.0.0-beta.15 (dual-track)

### Why oRPC over Hono RPC / tRPC

- Type safety covers request, response, error, and middleware (Hono RPC covers only request and response)
- Contract-first: define the contract before the implementation
- Framework integration: TanStack Query native
- vs tRPC: type checking 1.6x faster, runtime 2.8x faster, bundle 2x smaller
- Multi-runtime: CF Workers, Deno, Bun, Node

### Integration example

```ts
const getPost = os
  .use(dbProvider)
  .use(requireAuth)
  .route({ method: "GET", path: "/post/{id}" })
  .input(z.object({ id: z.string() }))
  .errors({ NOT_FOUND: { data: z.object({ id: z.string() }) } })
  .handler(async ({ input, context }) => {
    // context.user is typed
  });
```

## Official docs

- Hono: https://hono.dev
- oRPC: https://orpc.dev
