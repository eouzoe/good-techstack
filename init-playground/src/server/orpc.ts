import { createRouterClient } from '@orpc/server';
import { env } from 'cloudflare:workers';

import { appRouter } from '../routers/_app';
import { type AppEnv } from './env';
import { effectContext } from './os';

/// The router client runs inside the Worker itself, so the `cloudflare:workers`
/// `env` *is* the deployed environment (it is the same binding object, typed as
/// `any` by the runtime).
const contextEnv: AppEnv = env;

type ServerORPCClient = ReturnType<typeof createRouterClient<typeof appRouter>>;

let cached: ServerORPCClient | null = null;

const getServerClient = (): ServerORPCClient => {
  if (cached) {
    return cached;
  }
  cached = createRouterClient<typeof appRouter>(appRouter, {
    context: { 'effect/context': effectContext(contextEnv), env: contextEnv },
  });
  return cached;
};

export { getServerClient, type ServerORPCClient };
