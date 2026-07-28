import { createRouterClient } from '@orpc/server';
import { env } from 'cloudflare:workers';

import { appRouter } from '../routers/_app';
import { type HandlerContext } from './os';

const contextEnv: HandlerContext['env'] = {
  BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: env.BETTER_AUTH_URL,
  DB: env.DB,
  EVENTS_DO: env.EVENTS_DO,
  KV: env.KV,
  RATELIMIT: env.RATELIMIT,
  USE_MOCKS: env.USE_MOCKS,
};

type ServerORPCClient = ReturnType<typeof createRouterClient<typeof appRouter>>;

let cached: ServerORPCClient | null = null;

const getServerClient = (): ServerORPCClient => {
  if (cached) {
    return cached;
  }
  cached = createRouterClient<typeof appRouter>(appRouter, {
    context: { env: contextEnv },
  });
  return cached;
};

export { getServerClient, type ServerORPCClient };
