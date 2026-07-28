import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';

import { handleRPC } from '../../src/server/rpc';
import { features as featuresTable } from '../../src/server/db/schema';
import { getMigratedDb, resetWorkerDb, runAsyncInvariant } from './worker-common';

/// Phase E — §6.5/§6.9 request boundary on real workerd: the production
/// `handleRPC` (oRPC) → router proc → Valibot(contract) → Drizzle(`getDB`)
/// → REAL D1 binding, driven exactly as production does via a POST to
/// `/api/rpc/info/features`. This is the vertical slice that Phase D could only
/// emulate with `bun:sqlite`; here it runs on the actual Workers runtime.
///
/// The wire envelope is oRPC's success shape (`{ json: <output> }`), observed
/// rather than asserted, so the invariant stays on what the contract promises.

describe('§6.9 RPC request boundary through real D1', () => {
  beforeEach(async () => {
    await resetWorkerDb();
  });

  it('serves a D1-backed feature list through oRPC', async () => {
    expect.hasAssertions();
    const db = await getMigratedDb();
    await db.insert(featuresTable).values({ title: 't', description: 'd', icon: 'i' }).run();

    const status = await runAsyncInvariant({
      execute: async (): Promise<unknown> => {
        const res = await handleRPC(
          new Request('http://test/api/rpc/info/features', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{}',
          }),
          env,
        );
        const payload = (await res.json()) as { json: unknown };
        return payload.json;
      },
      oracle: (rows) => {
        const list = rows as { title: string }[] | undefined;
        return Array.isArray(list) && list.length === 1 && list[0]?.title === 't';
      },
      invariant: 'oRPC proxies the D1 row through contract validation to JSON',
    });
    expect(status).toBe('ok');
  });
});