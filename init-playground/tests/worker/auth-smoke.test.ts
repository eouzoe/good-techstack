import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { createAuth } from '../../src/server/auth';
import { getMigratedDb, resetWorkerDb } from './worker-common';

/// Auth boundary smoke test: better-auth 1.7.1 + Drizzle adapter + D1 schema
/// working end-to-end on workerd. Signs up, signs in, then resolves the session
/// from the issued cookie — the full path `src/server/auth.ts` exposes. This
/// guards the two defects this template previously shipped: the Drizzle adapter
/// getting no schema (any DB op threw "Schema not found") and the missing auth
/// tables in the D1 migrations.
describe('auth boundary (sign-up → sign-in → getSession)', () => {
  it('registers and authenticates a user through createAuth on workerd', async () => {
    expect.hasAssertions();
    await resetWorkerDb();
    await getMigratedDb();
    const auth = createAuth(env);

    const signUpRes = await auth.handler(
      new Request('http://test/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      }),
    );
    expect(signUpRes.status).toBe(200);
    const signUpBody = (await signUpRes.json()) as {
      user?: { email?: string };
      error?: { code?: string; message?: string };
    };
    expect(signUpBody.user?.email).toBe('test@example.com');

    const signInRes = await auth.handler(
      new Request('http://test/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      }),
    );
    expect(signInRes.status).toBe(200);
    const cookies = signInRes.headers.getSetCookie();
    expect(cookies.some((cookie) => cookie.includes('better-auth.session'))).toBe(true);

    const sessionRes = await auth.api.getSession({
      headers: new Headers({ cookie: cookies.join('; ') }),
    });
    expect(sessionRes?.user.email).toBe('test@example.com');
  });
});
