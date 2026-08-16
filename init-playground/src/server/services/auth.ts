import { type Session, type User } from 'better-auth';
import { Context, Effect, type Cause } from 'effect';

import { createAuth } from '../auth';
import { ServerEnv } from '../env';

export interface SessionInfo {
  session: Session | null;
  user: User | null;
}

export class AuthService extends Context.Service<
  AuthService,
  {
    readonly getSession: (
      headers: Headers,
    ) => Effect.Effect<SessionInfo, Cause.UnknownError, ServerEnv>;
  }
>()('gstack/server/services/AuthService') {}

export const AuthServiceLive = AuthService.of({
  getSession: Effect.fn('AuthService.getSession')(function* (
    headers: Headers,
  ): Effect.fn.Return<SessionInfo, Cause.UnknownError, ServerEnv> {
    const env = yield* ServerEnv;
    const auth = createAuth(env);
    const session = yield* Effect.tryPromise(() => auth.api.getSession({ headers }));
    return { session: session?.session ?? null, user: session?.user ?? null };
  }),
});
