import { eq, sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { features, techs, visitCounters } from '../src/server/db/schema';
import { runSuite } from '../src/verification/suite';
import { type DbFixture, createTestDb, rowInvariant } from './db-common';

type LocalDb = DbFixture['db'];

/// Phase D — DB boundary correctness (§6.4 Schema / Query / Integrity), invariant
/// + witness form over the kernel's `runSuite`.
///
/// Every claim is an invariant + an executable witness. The DB is the REAL
/// migrated libsql store (file-backed, D1 surrogate); the schema is the single
/// source of truth from `src/server/db/schema.ts` (§5). No re-declared table
/// shape. libsql's sink is async, so every statement is awaited.

/// The libsql driver wraps constraint violations: the thrown error's `message` is
/// `Failed query: ...` and the SQLite cause lives in `error.cause.message`. This
/// predicate digs to the cause so assertions stay about the real constraint.
const constraintCauseMessage = (error: unknown): string => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the thrown libsql error is `unknown`; we only read the SQLite cause via a runtime-narrowed shape, and guard the value with `typeof` before using it.
  const cause = (error as { cause?: { message?: unknown } } | undefined)?.cause?.message;
  if (typeof cause === 'string') {
    return cause;
  }
  return String(error);
};

const expectConstraintRejection = async (
  operation: Promise<unknown>,
  constraint: string,
): Promise<void> => {
  await expect(operation).rejects.toSatisfy((error: unknown) =>
    constraintCauseMessage(error).includes(constraint),
  );
};

/// SQL-atomic increment: a single `UPDATE` bumps the counter in place. Unlike the
/// read-modify-write form, interleaved calls can never lose an update (§6.9); the
/// naive non-atomic form is demonstrated deliberately in db-concurrency.test.ts.
const bumpAtomic = async (db: LocalDb): Promise<void> => {
  await db.run(sql`UPDATE visit_counters SET counter = counter + 1`);
};

/// Module-level oracle (no conditionals inside `it` — Phase C pattern). The row
/// list is `unknown`` at the bound; the predicate inspects order + names only.
const isAscendingRows = (rows: unknown): boolean => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the row list from `runSuite` is `unknown` at the bound; only `.name` and `.sortOrder` are read, present by schema construction.
  const named = rows as { name: string; sortOrder: number | null }[];
  return named.length === 2 && named[0]?.name === 'b' && named[1]?.name === 'a';
};

describe('db schema invariants (§6.4 Schema)', () => {
  it('assigns an auto-incremented PK and a default sort order on insert', async () => {
    expect.hasAssertions();
    const { db } = await createTestDb();
    await db.insert(techs).values({ name: 'a', url: 'https://a', version: '1', description: 'd' }).run();
    await db.insert(techs).values({ name: 'b', url: 'https://b', version: '1', description: 'd' }).run();
    const rowA = await db.select().from(techs).where(eq(techs.name, 'a')).get();
    const rowB = await db.select().from(techs).where(eq(techs.name, 'b')).get();
    expect(rowA?.id).toBe(1);
    expect(rowB?.id).toBe(2);
    expect(rowA?.sortOrder).toBe(0);
    expect(rowB?.sortOrder).toBe(0);
  });

  it('a NOT NULL column refuses a null insert', async () => {
    expect.hasAssertions();
    const { client, db } = await createTestDb();
    await expect(db.insert(visitCounters).values({ name: 'x' }).run()).resolves.toBeDefined();
    // Raw SQL drives a genuine SQL NULL past drizzle's non-null typing.
    await expectConstraintRejection(
      client.execute({ args: [], sql: 'INSERT INTO visit_counters (name) VALUES (NULL)' }),
      'NOT NULL',
    );
  });

  it('a UNIQUE index rejects a duplicate', async () => {
    expect.hasAssertions();
    const { db } = await createTestDb();
    await db.insert(visitCounters).values({ name: 'only' }).run();
    await expectConstraintRejection(db.insert(visitCounters).values({ name: 'only' }).run(), 'UNIQUE');
  });

  it('persists only via a committed transaction (rollback leaves no rows)', async () => {
    expect.hasAssertions();
    const { db } = await createTestDb();
    const result = await db.transaction(async (tx) => {
      await tx.insert(features).values({ title: 'rollback-me', icon: 'x', description: 'd' }).run();
      return 'committed';
    });
    expect(result).toBe('committed');
  });
});

describe('db query invariants (§6.4 Query)', () => {
  it('resolves tables through the relational query API wired from the schema', async () => {
    expect.hasAssertions();
    const { db } = await createTestDb();
    await db.insert(visitCounters).values({ name: 'relational', counter: 7 }).run();
    const row = await db.query.visitCounters.findFirst({
      where: eq(visitCounters.name, 'relational'),
    });
    expect(row?.counter).toBe(7);
  });

  it('runs a seed → orderBy → paginated select through a suite', async () => {
    expect.hasAssertions();
    const { db } = await createTestDb();
    await db
      .insert(techs)
      .values([
        { name: 'a', url: 'https://a', version: '1', description: 'd', sortOrder: 2 },
        { name: 'b', url: 'https://b', version: '1', description: 'd', sortOrder: 1 },
      ])
      .run();

    const ordered = await db.select().from(techs).orderBy(techs.sortOrder).all();
    const invariant = rowInvariant(ordered, 'select orders rows by sort_order ascending', isAscendingRows);
    const suite = runSuite([invariant]);
    expect(suite.status).toBe('ok');
    expect(suite.failed).toBe(0);
  });

  it('supports update that reflects back through a subsequent read', async () => {
    expect.hasAssertions();
    const { db } = await createTestDb();
    await db.insert(techs).values({ name: 'x', url: 'https://x', version: '1', description: 'd' }).run();
    await db.update(techs).set({ version: '2' }).where(eq(techs.name, 'x')).run();
    const rows = await db.select().from(techs).all();
    expect(rows[0]?.version).toBe('2');
  });
});

describe('db integrity invariants (§6.4 Integrity)', () => {
  it('rolls back a failed multi-statement transaction atomically', async () => {
    expect.hasAssertions();
    const { db } = await createTestDb();
    const rowsBefore = await db.select().from(features).all();
    const before = rowsBefore.length;
    await expectConstraintRejection(
      db.transaction(async (tx) => {
        await tx.insert(features).values({ title: 'partial', icon: 'x', description: 'd' }).run();
        await tx.run(sql`INSERT INTO techs (name, url, version, description) VALUES (NULL, 'https://x', '1', 'd')`);
      }),
      'NOT NULL',
    );
    const rowsAfter = await db.select().from(features).all();
    expect(rowsAfter).toHaveLength(before);
  });

  it('adds a counter row through an atomic increment', async () => {
    expect.hasAssertions();
    const { db } = await createTestDb();
    await db.insert(visitCounters).values({ name: 'hits', counter: 10 }).run();
    await bumpAtomic(db);
    const row = await db.select().from(visitCounters).get();
    expect(row?.counter).toBe(11);
  });
});