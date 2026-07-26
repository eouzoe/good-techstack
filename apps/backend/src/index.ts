import { Hono } from "hono";
import { RPCHandler } from "@orpc/server/fetch";
import { itemHandler } from "./handler";
import { createAuth } from "./auth";
import { createDb } from "./db";

export interface Env {
  Bindings: {
    DB: D1Database;
    BETTER_AUTH_URL: string;
    BETTER_AUTH_SECRET: string;
  };
  Variables: {
    userId: string | null;
  };
}

const app = new Hono<Env>();

// Better-auth handler
const getAuth = (c: { env: Env["Bindings"] }) => createAuth(c.env);
app.on(["GET", "POST"], "/api/auth/*", (c) => 
  getAuth(c).handler(c.req.raw)
);

// ORPC RPC handler
const orpcHandler = new RPCHandler(itemHandler);

app.use("/rpc/*", async (c, next) => {
  const { matched, response } = await orpcHandler.handle(c.req.raw, {
    context: { db: createDb(c.env.DB), user: null },
    prefix: "/rpc",
  });
  if (matched) {
    return c.newResponse(response.body, response);
  }
  await next();
});

app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
