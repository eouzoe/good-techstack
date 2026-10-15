import { beforeEach, describe, expect, it } from 'vitest';

import { visitCounters } from '../../src/server/db/schema';
import { getMigratedDb, resetWorkerDb, runAsyncInvariant } from './worker-common';

/// Phase E — Worker boundary, real-workerd runtime (§6.8 Worker runtime
/// correctness). Every claim runs inside Miniflare's workerd via
/// `@cloudflare/vitest-plugin`, not the node/bun runtime.
///
/// The item under test is the REAL D1 binding (`env.DB` from wrangler.jsonc),
/// migrated through the D1-native batch path (`applyD1Migrations`) — the
/// semantics fix from the Phase E kickoff card (real D1 has no BEGIN/COMMIT).

describe('worker runtime invariants (§6.8)', () => {
  beforeEach(async () => {
    await resetWorkerDb();
  });

  it('runs in the Workers runtime and migrates the schema through D1', async () => {
    expect.hasAssertions();
    const db = await getMigratedDb();
    const status = await runAsyncInvariant({
      execute: () => db.select().from(visitCounters).all(),
      oracle: (rows) => rows.length === 0,
      invariant: 'D1 applies the drizzle journal and exposes every table',
    });
    expect(status).toBe('ok');
  });

  it('keeps tables (not just the store) reachable through the relational API', async () => {
    expect.hasAssertions();
    const db = await getMigratedDb();
    await db.insert(visitCounters).values({ name: 'relational', counter: 5 }).run();
    const row = await db.query.visitCounters.findFirst({});
    expect(row?.counter).toBe(5);
  });
});
