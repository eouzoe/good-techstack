import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { checkHealth } from '../../src/server/health';

/// Health probe (SYSTEM-ARCHITECTURE research item 9): the boundary the
/// deploy stage and the devenv readiness probe both lean on. These run against
/// the real D1 binding inside workerd, so a regression in the probe's query
/// path — not just in its response shape — turns red here.
///
/// The unreachable branch is driven through a binding whose `prepare` throws:
/// drizzle still builds the statement, D1 never answers, and the probe must
/// degrade instead of propagating the error.

describe('health probe against the D1 binding', () => {
  it('reports the binding as reachable', async () => {
    expect.hasAssertions();
    const report = await checkHealth(env.DB);
    expect(report).toStrictEqual({ checks: { d1: 'ok' }, status: 'ok' });
  });

  it('degrades when the binding cannot answer', async () => {
    expect.hasAssertions();
    const broken = {
      prepare: () => {
        throw new Error('D1 unreachable in this test');
      },
    } as unknown as D1Database;
    const report = await checkHealth(broken);
    expect(report).toStrictEqual({ checks: { d1: 'unreachable' }, status: 'degraded' });
  });
});
