import '@orpc/experimental-effect/extensions/effect';
import { type WithEffectContext } from '@orpc/experimental-effect';
import { implement } from '@orpc/server';
import { type Session, type User } from 'better-auth';
import { Context, Effect } from 'effect';

import { contract } from '#shared/contracts/index';

import { D1 } from './db';
import { type AppEnv, ServerEnv } from './env';
import { AuthService, AuthServiceLive } from './services/auth';
import { FeaturesService, FeaturesServiceLive } from './services/features';
import { TechsService, TechsServiceLive } from './services/techs';

interface HandlerContext {
  env: AppEnv;
  reqHeaders?: Headers;
}

/// Effect services reachable from `.effect()` procedures. Add a tag here when a
/// service becomes part of the RPC layer.
type EffectServices = D1 | ServerEnv | AuthService | FeaturesService | TechsService;

/// Effect-native oRPC context: carries an `effect/context` slot so procedures
/// written with `.effect()` (via `@orpc/experimental-effect`) can yield Effect
/// services directly.
type EffectContext = WithEffectContext<EffectServices>;

/// Composition root: every oRPC entry point (RPCHandler, router client,
/// middleware `next`) must provide a populated `effect/context`. Caller modules
/// merge this into the rest of their oRPC context.
const effectContext = (env: AppEnv): EffectContext['effect/context'] =>
  Context.empty().pipe(
    Context.add(ServerEnv, env),
    Context.add(D1, env.DB),
    Context.add(AuthService, AuthServiceLive),
    Context.add(FeaturesService, FeaturesServiceLive),
    Context.add(TechsService, TechsServiceLive),
  );

interface AuthContext {
  auth: { session: Session | null; user: User | null };
}

type ServerContext = HandlerContext & EffectContext;

const os = implement<typeof contract, ServerContext>(contract);

/// Opt-in session middleware (auth boundary): resolves the better-auth session
/// from the request headers (injected by `RequestHeadersHandlerPlugin`) and
/// exposes it as `context.auth`. Apply it to routers/procedures that need it:
///
///   const protectedProcedure = os.info.pageMeta.use(withAuth);
const withAuth = os.middleware(async ({ context, next }) => {
  // Depend on the AuthService tag (interface), not the Live module: services
  // Resolve from the composition-root Context carried in oRPC's effect/context,
  // Allowing tests to swap any of them via provideContext.
  const session = await Effect.runPromise(
    Effect.gen(function* () {
      const auth = yield* AuthService;
      return yield* auth.getSession(context.reqHeaders ?? new Headers());
    }).pipe(Effect.provideContext(context['effect/context'])),
  );
  return next({
    context: {
      ...context,
      auth: {
        session: session.session,
        user: session.user,
      },
    },
  });
});

export {
  effectContext,
  os,
  withAuth,
  type AuthContext,
  type EffectContext,
  type HandlerContext,
  type ServerContext,
};
