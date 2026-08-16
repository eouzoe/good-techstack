import { describe, expect, it } from 'vitest';

import { features, techs, visitCounters } from '../src/server/db/schema';
import { runSuite } from '../src/verification/suite';
import {
  applyMigrations,
  createTestDb,
  openDbWithMigrations,
  removeMigrationsFolder,
  rowInvariant,
  sliceMigrationsFolder,
} from './db-common';

/// Phase D — migration testing (§6.5): schema valid / data preserved / constraints
/// valid / application compatible / rollback (snapshot → migrate → invariant).
///
/// The real `./drizzle` journal + SQL are the source of truth. We slice that
/// journal to reproduce "historical" states, advance forward, and assert the data
/// and schema survive. Temp folders are cleaned up inline (try/finally), never via
/// a shared afterEach hook — each test owns its teardown (§ Phase C pattern).

/// Module-level oracle: the migrated techs are seeded in [a:sort2, b:sort1] and a
/// migrated schema must return them ordered ascending → b, a.
const isAscendingRows = (rows: unknown): boolean => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the row list from `runSuite` is `unknown` at the bound; only `.name` is read, present by schema construction.
  const named = rows as { name: string }[];
  return named.length === 2 && named[0]?.name === 'b' && named[1]?.name === 'a';
};

describe('db migration invariants (§6.5)', () => {
  it('applies the full journal and yields every table', async () => {
    expect.hasAssertions();
    const { db } = await createTestDb();
    await expect(db.select().from(features).all()).resolves.toHaveLength(0);
    await expect(db.select().from(techs).all()).resolves.toHaveLength(0);
    await expect(db.select().from(visitCounters).all()).resolves.toHaveLength(0);
  });

  it('is idempotent: re-applying the journal keeps rows', async () => {
    expect.hasAssertions();
    const { db } = await createTestDb();
    await db.insert(features).values({ title: 'keep', icon: 'x', description: 'd' }).run();
    await db
      .insert(techs)
      .values({ name: 'keep', url: 'https://k', version: '1', description: 'd' })
      .run();
    // Second full apply on the same handle must be a no-op for existing data.
    await applyMigrations(db, new URL('../drizzle', import.meta.url).pathname);
    await expect(db.select().from(features).all()).resolves.toHaveLength(1);
    await expect(db.select().from(techs).all()).resolves.toHaveLength(1);
  });

  it('advances forward from an older schema preserving seed data', async () => {
    expect.hasAssertions();
    const folder0000 = sliceMigrationsFolder(1);
    try {
      const historical = await openDbWithMigrations(folder0000);
      await historical.db
        .insert(techs)
        .values({ name: 'v1', url: 'https://v1', version: '1', description: 'd' })
        .run();
      const beforeTables = await historical.db.all(
        "SELECT name FROM sqlite_master WHERE name = 'visit_counters'",
      );
      expect(beforeTables).toHaveLength(0);

      const folderFull = sliceMigrationsFolder(2);
      await applyMigrations(historical.db, folderFull);
      const migratedTechs = await historical.db.select().from(techs).all();
      const counters = await historical.db.select().from(visitCounters).all();
      expect(migratedTechs).toHaveLength(1);
      expect(migratedTechs[0]?.name).toBe('v1');
      expect(counters).toHaveLength(0);
      const viaRelational = await historical.db.query.visitCounters.findFirst();
      expect(viaRelational).toBeUndefined();
      removeMigrationsFolder(folderFull);
      historical.close();
    } finally {
      removeMigrationsFolder(folder0000);
    }
  });

  it('rollback strategy: an older snapshot has no counter table and no unique index', async () => {
    expect.hasAssertions();
    const folder0000 = sliceMigrationsFolder(1);
    try {
      const snapshot = await openDbWithMigrations(folder0000);
      const tables = await snapshot.db.all<{ name: string }>('SELECT name FROM sqlite_master');
      const names = tables.map((row) => row.name);
      expect(names).toContain('features');
      expect(names).toContain('techs');
      expect(names).not.toContain('visit_counters');
      snapshot.close();
    } finally {
      removeMigrationsFolder(folder0000);
    }
  });

  it('runs the app query suite against the migrated schema', async () => {
    expect.hasAssertions();
    const { db } = await createTestDb();
    await db
      .insert(techs)
      .values({ name: 'a', url: 'https://a', version: '1', description: 'd', sortOrder: 2 })
      .run();
    await db
      .insert(techs)
      .values({ name: 'b', url: 'https://b', version: '1', description: 'd', sortOrder: 1 })
      .run();
    const ordered = await db.select().from(techs).orderBy(techs.sortOrder).all();
    const invariant = rowInvariant(
      ordered,
      'app queries work against the migrated schema',
      isAscendingRows,
    );
    const suite = runSuite([invariant]);
    expect(suite.status).toBe('ok');
    expect(suite.failed).toBe(0);
  });
});
