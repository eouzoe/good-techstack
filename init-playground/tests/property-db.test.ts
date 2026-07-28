import { eq } from 'drizzle-orm';
import { describe, it } from 'vitest';
import { assert, asyncProperty, nat } from 'fast-check';

import { visitCounters } from '../src/server/db/schema';
import { createTestDb } from './db-common';

/// Phase F — property-based DB invariant (§6.10) on the node gate over the
/// libsql D1 surrogate from `db-common`. SAME fixture semantics as Phase D.
///
/// Invariant (metamorphic, arithmetic): an inline read-modify-write bump on a
/// persisted NOT NULL integer counter is a deterministic +1 step — after `n`
/// bumps the counter sits exactly at `start + n`.
///
/// One migrated store per draw (fresh isolation); fast-check drives the
/// arithmetic across short property runs. The bump loop is deliberately SEQUENted
/// — that serial order is the invariant under test, so awaits stay in the loop.

describe('Phase F — DB arithmetic property', () => {
  it('bumping a row n times leaves its counter exactly start + n', async () => {
    await assert(
      asyncProperty(nat({ max: 32 }), async (n) => {
        const { db, close } = await createTestDb();
        try {
          // Fresh store per draw → consistent 0-start, no cross-draw bleed.
          const name = `prop-n-${n}`;
          await db.insert(visitCounters).values({ name, counter: 0 }).run();
          const startRow = await db.select({ counter: visitCounters.counter }).from(visitCounters).where(eq(visitCounters.name, name)).get();
          const start = startRow?.counter ?? 0;
          // The sequential bump IS the invariant: closed arithmetic, not
          // Parallel throughput — awaits in the loop are intentional.
          for (let i = 0; i < n; i += 1) {
            const row = await db.select({ counter: visitCounters.counter }).from(visitCounters).where(eq(visitCounters.name, name)).get();
            const next = (row?.counter ?? 0) + 1;
            await db.update(visitCounters).set({ counter: next }).where(eq(visitCounters.name, name)).run();
          }
          const endRow = await db.select({ counter: visitCounters.counter }).from(visitCounters).where(eq(visitCounters.name, name)).get();
          const end = endRow?.counter ?? 0;
          return end === start + n;
        } finally {
          close();
        }
      }),
      { numRuns: 16 },
    );
  }, 30000);
});