import { describe, expect, it } from 'vitest';

import { visitCounters } from '../src/server/db/schema';
import { type DbFixture, createSharedDb } from './db-common';

/// Schema must be wired into the shared-store client too: if `createSharedDb` lost
/// its `{ schema }` binding, the relational query below would throw (no table
/// resol, §6.4). Kept as a standalone assertion so concurrency tests stay
/// interleaving-only; this runs first in the block below.
const assertSharedSchemaWired = async (db: Db): Promise<void> => {
  await expect(db.query.visitCounters.findFirst()).resolves.toBeUndefined();
};

type Db = DbFixture['db'];

/// Non-atomic read-modify-write: writes `base + 1` into the store. When two of
/// these run off the SAME stale read, one update is lost (§6.9). The base is
/// passed in so the caller controls the interleaving; no conditional lives inside
/// a test body (Phase C pattern).
const bumpFrom = async (base: { counter: number } | undefined, db: Db): Promise<void> => {
  const next = (base?.counter ?? 0) + 1;
  await db.update(visitCounters).set({ counter: next }).run();
};

/// Phase D — concurrency (§6.9): two clients, one store, interleaved writes.
///
/// The classic database races are reproduced deterministically by manually
/// interleaving two clients' read-modify-write cycles against the SAME
/// file-backed libsql store:
///   • a naive read-then-write client silently loses an update (§6.9);
///   • the SQL-atomic `counter = counter + 1` form does not (§6.9);
///   • many concurrent SQL-atomic writers still total exactly N;
///   • a failed transaction leaves the counter untouched.
///
/// These are the invariants an application must preserve at the DB boundary; the
/// oracle here is the real schema + real store, never a re-declared model.

describe('db concurrency invariants (§6.9)', () => {
  it('a naive read-modify-write loses an update when interleaved', async () => {
    expect.hasAssertions();

    const { cleanup, dbA, dbB } = await createSharedDb();
    try {
      await assertSharedSchemaWired(dbA.db);
      await assertSharedSchemaWired(dbB.db);
      await dbA.db.insert(visitCounters).values({ name: 'hits', counter: 0 }).run();

      // Manual interleave: A reads 0, B reads 0, A writes 1, B writes 1 → lost update.
      const aRead = await dbA.db.select().from(visitCounters).get();
      const bRead = await dbB.db.select().from(visitCounters).get();
      expect(aRead?.counter).toBe(0);
      expect(bRead?.counter).toBe(0);
      await bumpFrom(aRead, dbA.db);
      await bumpFrom(bRead, dbB.db);
      const row = await dbA.db.select().from(visitCounters).get();
      expect(row?.counter).toBe(1);
    } finally {
      cleanup();
    }
  });

  it('the SQL-atomic increment form does NOT lose an update when interleaved', async () => {
    expect.hasAssertions();

    const { cleanup, dbA, dbB } = await createSharedDb();
    try {
      await dbA.db.insert(visitCounters).values({ name: 'hits', counter: 0 }).run();
      // Interleave two atomic `counter = counter + 1` writes → both take effect.
      await Promise.all([
        dbA.client.execute(`UPDATE visit_counters SET counter = counter + 1 WHERE name = 'hits'`),
        dbB.client.execute(`UPDATE visit_counters SET counter = counter + 1 WHERE name = 'hits'`),
      ]);
      const row = await dbA.db.select().from(visitCounters).get();
      expect(row?.counter).toBe(2);
    } finally {
      cleanup();
    }
  });

  it('totals exactly N across N concurrent SQL-atomic increments', async () => {
    expect.hasAssertions();

    const { cleanup, dbA, dbB } = await createSharedDb();
    try {
      await dbA.db.insert(visitCounters).values({ name: 'hits', counter: 0 }).run();
      const writerCount = 8;
      const writes = await Promise.all(
        Array.from({ length: writerCount }, () =>
          dbA.client.execute(`UPDATE visit_counters SET counter = counter + 1 WHERE name = 'hits'`),
        ),
      );
      expect(writes).toHaveLength(writerCount);
      const row = await dbB.db.select().from(visitCounters).get();
      expect(row?.counter).toBe(writerCount);
    } finally {
      cleanup();
    }
  });

  it('a failed transaction rolls back, leaving the counter untouched', async () => {
    expect.hasAssertions();

    const { cleanup, dbA, dbB } = await createSharedDb();
    try {
      await dbA.db.insert(visitCounters).values({ name: 'hits', counter: 7 }).run();
      await expect(
        dbA.db.transaction(async (tx) => {
          await tx.update(visitCounters).set({ counter: 99 }).run();
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');
      const row = await dbB.db.select().from(visitCounters).get();
      expect(row?.counter).toBe(7);
    } finally {
      cleanup();
    }
  });
});
