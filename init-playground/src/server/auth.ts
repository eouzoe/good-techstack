import { CloudflareRateLimiter } from '@orpc/cloudflare';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth/minimal';

import { getDB } from './db/index';
import * as schema from './db/schema';
import { logger } from './logging';

interface AuthEnv {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  KV: KVNamespace;
  RATELIMIT: RateLimit;
  DB: D1Database;
}

const MIN_TTL_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const SECONDS_PER_MINUTE = 60;
const SESSION_UPDATE_AGE_MINUTES = 15;
const SESSION_UPDATE_AGE_SECONDS = SECONDS_PER_MINUTE * SESSION_UPDATE_AGE_MINUTES;

/// Auth boundary: sign-in abuse protection is better-auth's own concern,
/// backed by Cloudflare's edge-native rate limiter (the same primitive the RPC
/// boundary exposes for procedures, with a distinct prefix).
const consumeRateLimit = async (
  env: AuthEnv,
  key: string,
  rule: { window: number; max: number },
) => {
  try {
    const rateLimiter = new CloudflareRateLimiter(env.RATELIMIT, { prefix: 'auth:' });
    const { success } = await rateLimiter.limit(key);
    let retryAfter: number | null = null;
    if (!success) {
      retryAfter = rule.window;
    }
    return { allowed: success, retryAfter };
  } catch (error) {
    logger.warn('[auth] Rate limit consume failed', { error: String(error), key });
    return { allowed: true, retryAfter: null };
  }
};

const backgroundTaskHandler = async (promise: Promise<unknown>): Promise<void> => {
  try {
    await promise;
  } catch (error) {
    logger.warn('[auth] Background task failed', { error: String(error) });
  }
};

const kvDelete = async (env: AuthEnv, key: string): Promise<void> => {
  try {
    await env.KV.delete(key);
  } catch (error) {
    logger.warn('[auth] KV delete failed', { error: String(error), key });
  }
};

const kvGet = async (env: AuthEnv, key: string): Promise<string | null> => {
  try {
    return await env.KV.get(key);
  } catch {
    return null;
  }
};

const kvGetAndDelete = async (env: AuthEnv, key: string): Promise<string | null> => {
  try {
    const value = await env.KV.get(key);
    if (value !== null) {
      await env.KV.delete(key);
    }
    return value;
  } catch {
    return null;
  }
};

const kvIncrement = async (env: AuthEnv, key: string, ttl: number): Promise<number> => {
  try {
    const current = Number((await env.KV.get(key)) ?? 0);
    const next = current + 1;
    await env.KV.put(key, String(next), { expirationTtl: Math.max(ttl, MIN_TTL_SECONDS) });
    return next;
  } catch {
    return 1;
  }
};

const kvSet =
  (env: AuthEnv) =>
  async (key: string, value: string, ttl?: number): Promise<void> => {
    try {
      if (ttl === undefined) {
        await env.KV.put(key, value);
        return;
      }
      const effectiveTtl = Math.max(ttl, MIN_TTL_SECONDS);
      await env.KV.put(key, value, { expirationTtl: effectiveTtl });
    } catch (error) {
      logger.warn('[auth] KV set failed', { error: String(error), key });
    }
  };

export const createAuth = (env: AuthEnv) =>
  betterAuth({
    advanced: {
      backgroundTasks: {
        handler: backgroundTaskHandler,
      },
    },
    database: drizzleAdapter(getDB(env.DB), {
      provider: 'sqlite',
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    rateLimit: {
      customStorage: {
        consume: (key, rule) => consumeRateLimit(env, key, rule),
      },
      max: RATE_LIMIT_MAX_REQUESTS,
      window: RATE_LIMIT_WINDOW_SECONDS,
    },
    secondaryStorage: {
      delete: (key) => kvDelete(env, key),
      get: (key) => kvGet(env, key),
      getAndDelete: (key) => kvGetAndDelete(env, key),
      increment: (key, ttl) => kvIncrement(env, key, ttl),
      set: kvSet(env),
    },
    secret: env.BETTER_AUTH_SECRET,
    session: {
      storeSessionInDatabase: true,
      /// cookieCache disabled — better-auth bug #4203
      updateAge: SESSION_UPDATE_AGE_SECONDS,
    },
    url: env.BETTER_AUTH_URL,
  });
