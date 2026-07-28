import { eq } from 'drizzle-orm';
import { beforeEach, describe, it } from 'vitest';
import { assert, asyncProperty, nat } from 'fast-check';

import { visitCounters } from '../../src/server/db/schema';
import { getMigratedDb, resetWorkerDb } from './worker-common';

/// Phase F — property-based invariant (§6.10) on the WORKER boundary: the
/// arithmetic falls out of real D1 through the Drizzle `getDB` adapter —
/// fast-check drives the draw count over the genuine D1 store.
///
/// Same fixed-point as the Phase F node-gate property, but here it runs against
/// the batch-only D1 semantics (no BEGIN/COMMIT): each bump is a read-then-
/// update in one D1 request. Bumps are sequential (awaited), so the invariant is
/// that `n` awaited bumps land exactly at `start + n`.
///
/// Uses fast-check's `asyncProperty` (pure JS, so it runs inside
/// vitest-pool-workers). No kernel mutation — the kernel stays the single host
/// of §1.6 semantics.

describe('§6.10 property-based D1 arithmetic over the real W1 store', () => {
  let drawId = 0;

  beforeEach(async () => {
    await resetWorkerDb();
  });

  it('bumping a D1 row n times lands its counter exactly at start + n', async () => {
    await assert(
      asyncProperty(nat({ max: 24 }), async (bumpCount) => {
        drawId += 1;
        const db = await getMigratedDb();
        const name = `prop-w-${drawId}-${bumpCount}`;
        await db.insert(visitCounters).values({ name, counter: 0 }).run();
        const startRow = await db.select({ counter: visitCounters.counter }).from(visitCounters).where(eq(visitCounters.name, name)).get();
        const start = startRow?.counter ?? 0;
        for (let i = 0; i < bumpCount; i += 1) {
          const row = await db.select({ counter: visitCounters.counter }).from(visitCounters).where(eq(visitCounters.name, name)).get();
          await db.update(visitCounters).set({ counter: (row?.counter ?? 0) + 1 }).where(eq(visitCounters.name, name)).run();
        }
        const endRow = await db.select({ counter: visitCounters.counter }).from(visitCounters).where(eq(visitCounters.name, name)).get();
        const end = endRow?.counter ?? -1;
        return end === start + bumpCount;
      }),
      { numRuns: 16 },
    );
  }, 30000);
});