import { betterAuth } from "better-auth";

export function createAuth(env: {
  DB: D1Database;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
}) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    database: env.DB,
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
  });
}
