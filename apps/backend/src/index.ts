import { Hono } from "hono";
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
  getAuth(c).handler(c.req.raw),
);

app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
