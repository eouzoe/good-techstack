import { implement } from '@orpc/server';
import { type Session, type User } from 'better-auth';

import { contract } from '#shared/contracts/index';

import { createAuth } from './auth';

interface HandlerContext {
  env: {
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    DB: D1Database;
    EVENTS_DO: DurableObjectNamespace;
    KV: KVNamespace;
    RATELIMIT: RateLimit;
    USE_MOCKS: string;
  };
  reqHeaders?: Headers;
}

interface AuthContext {
  auth: { session: Session | null; user: User | null };
}

const os = implement<typeof contract, HandlerContext>(contract);

/// Opt-in session middleware (auth boundary): resolves the better-auth session
/// from the request headers (injected by `RequestHeadersHandlerPlugin`) and
/// exposes it as `context.auth`. Apply it to routers/procedures that need it:
///
///   const protectedProcedure = os.info.pageMeta.use(withAuth);
const withAuth = os.middleware(async ({ context, next }) => {
  const auth = createAuth(context.env);
  const session = await auth.api.getSession({ headers: context.reqHeaders ?? new Headers() });
  return next({
    context: {
      auth: {
        session: session?.session ?? null,
        user: session?.user ?? null,
      },
    },
  });
});

export { os, withAuth, type AuthContext, type HandlerContext };
