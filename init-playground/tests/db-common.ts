import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

import { relations } from '../src/server/db/relations';
import { type VerifyOptions } from '../src/verification/verify';

/// Phase D — third replication to the DB (Drizzle + libsql) boundary (plan
/// §6.4 / §6.5 / §6.9).
///
/// Shared adapter for the DB tests. The kernel's `verify()` / `runSuite()`
/// primitives are reproduced over real database cases: `execute` runs an actual
/// statement (insert / select / update / transaction), `observe` reads rows back,
/// `oracle` decides via the REAL Drizzle schema — never a re-declared copy.
///
/// libsql (the engine D1 embeds) stands in for the D1 binding under test, over a
/// unique on-disk temp file so every connection shares one store. Migrations live
/// in the tracked `./drizzle` folder — the single source of truth for DDL (§5) —
/// applied through drizzle's own `migrate()`. The kernel core stays untouched
/// (§1.15).

type LocalDb = LibSQLDatabase<typeof relations>;

const MIGRATIONS_FOLDER = new URL('../drizzle', import.meta.url).pathname;

const migrateOpts = (): Parameters<typeof migrate>[1] => ({ migrationsFolder: MIGRATIONS_FOLDER });

/// Unique temp path for one isolated store. libsql's node sqlite driver may open
/// more than one connection, so `:memory:` is unsafe (each connection would see a
/// fresh, empty DB); a real `file:` URL guarantees they share one store.
const makeTempDbPath = (): string =>
  `/tmp/gstack-phaseD-${process.pid}-${Math.random().toString(36).slice(2)}.db`;

interface DbFixture {
  client: Client;
  close: () => void;
  db: LocalDb;
}

const closeClient = (path: string, client: Client): void => {
  client.close();
  try {
    unlinkSync(path);
  } catch {
    // Store already gone — fine during test teardown.
  }
};

/// Bake one fresh, migrated, isolated database per call. Every test gets its own
/// store — no cross-test leakage, matching the per-request isolation the worker
/// runtime is expected to provide (§6.8).
const createTestDb = async (): Promise<DbFixture> => {
  const path = makeTempDbPath();
  const client = createClient({ url: `file:${path}` });
  const db = drizzle({ client, relations });
  await migrate(db, migrateOpts());
  return {
    client,
    close: () => {
      closeClient(path, client);
    },
    db,
  };
};

/// Open a store at a temp file, applying migrations from a SPECIFIC folder (not
/// necessarily the full one). Used by §6.5 to reproduce historical schema states.
const openDbWithMigrations = async (migrationsFolder: string): Promise<DbFixture> => {
  const path = makeTempDbPath();
  const client = createClient({ url: `file:${path}` });
  const db = drizzle({ client, relations });
  await migrate(db, { migrationsFolder });
  return {
    client,
    close: () => {
      closeClient(path, client);
    },
    db,
  };
};

/// Push an EXISTING store forward by applying an additional migrations folder.
/// drizzle's `migrate()` only applies entries newer than the tracked last one, so
/// re-running on the same handle advances in place and preserves existing data.
const applyMigrations = async (db: LocalDb, migrationsFolder: string): Promise<void> => {
  await migrate(db, { migrationsFolder });
};

/// Bake a shared file-backed store so two clients can drive real interleaved
/// writes against the SAME underlying database (lost update / stale read, §6.9).
/// WAL is enabled (via the connection URL) and a busy timeout set so concurrent
/// writers wait for the lock instead of failing instantly with SQLITE_BUSY.
/// Open one migrated WAL-enabled client over a shared file-backed store.
const openSharedClient = async (path: string): Promise<{ client: Client; db: LocalDb }> => {
  const client = createClient({ url: `file:${path}` });
  const db = drizzle({ client, relations });
  await migrate(db, migrateOpts());
  await client.execute('PRAGMA journal_mode = WAL;');
  await client.execute('PRAGMA busy_timeout = 5000;');
  return { client, db };
};

const createSharedDb = async (): Promise<{
  cleanup: () => void;
  dbA: DbFixture;
  dbB: DbFixture;
}> => {
  const path = makeTempDbPath();
  const { client: clientA, db: dbA } = await openSharedClient(path);
  const { client: clientB, db: dbB } = await openSharedClient(path);
  const cleanup = () => {
    closeClient(path, clientA);
    clientB.close();
  };
  return {
    cleanup,
    dbA: {
      client: clientA,
      close: () => {
        clientA.close();
      },
      db: dbA,
    },
    dbB: {
      client: clientB,
      close: () => {
        clientB.close();
      },
      db: dbB,
    },
  };
};

/// ── Migration helpers (§6.5) ─────────────────────────────────────────────────────
///
/// drizzle's `migrate()` applies every journal entry whose `when` (folderMillis)
/// is newer than the last applied one, tracked in `__drizzle_migrations`. To
/// exercise forward migration (apply an older schema, then advance) and data
/// preservation, we build a temporary migrations folder containing a slice of the
/// real journal + matching SQL, apply it, then apply the full folder on top. The
/// SQL files in `./drizzle` remain the single source of truth — we never hand-write
/// DDL here.

interface JournalEntry {
  tag: string;
  when: number;
}

const isJournalEntry = (value: unknown): value is JournalEntry => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- structural guard on an `unknown` JSON payload; the narrow record is checked field-by-field by the string/number `typeof` below.
  const { tag } = value as Record<string, unknown>;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- structural guard on an `unknown` JSON payload; the narrow record is checked field-by-field by the `typeof` below.
  const { when } = value as Record<string, unknown>;
  return typeof tag === 'string' && typeof when === 'number';
};

/// Pure validator over an `unknown` journal `entries` payload. Throws when the
/// shape does not satisfy the migration journal contract, so callers can trust the
/// returned list is a well-formed `JournalEntry[]`. Kept separate from the file
/// read so tests can drive the guard with malformed payloads directly (the real
/// on-disk journal is always well-formed, so those branches are otherwise dead).
const parseJournalEntries = (entries: unknown): JournalEntry[] => {
  if (!Array.isArray(entries) || !entries.every((entry) => isJournalEntry(entry))) {
    throw new Error('Invalid drizzle migration journal: entries is not an array of entries');
  }
  return entries;
};

const readJournalEntries = (): JournalEntry[] => {
  const folders = readdirSync(MIGRATIONS_FOLDER).filter((name) =>
    existsSync(join(MIGRATIONS_FOLDER, name, 'migration.sql')),
  );
  folders.sort((left, right) => left.localeCompare(right));
  return folders.map((tag) => ({ tag, when: Math.trunc(Number(tag.slice(0, 14))) }));
};

/// Build a temp migrations folder containing only the first `count` real journal
/// entries as `<tag>/migration.sql` folders (drizzle-kit v1 format). Returns its
/// path. The journal keeps each entry's real `when` so drizzle applies exactly
/// these and advances correctly.
const sliceMigrationsFolder = (count: number): string => {
  const folder = mkdtempSync(join(tmpdir(), 'gstack-migrations-'));
  const entries = readJournalEntries().slice(0, count);
  for (const entry of entries) {
    const sql = readFileSync(join(MIGRATIONS_FOLDER, entry.tag, 'migration.sql'), 'utf8');
    mkdirSync(join(folder, entry.tag), { recursive: true });
    writeFileSync(join(folder, entry.tag, 'migration.sql'), sql);
  }
  return folder;
};

/// Remove a temp migrations folder created by `sliceMigrationsFolder`.
const removeMigrationsFolder = (folder: string): void => {
  rmSync(folder, { recursive: true, force: true });
};

/// Invariant + witness over a DB observation, mirroring Phase B/C's
/// `outputInvariant` but for real row payloads. The witness is the row list from
/// an executed query; the oracle is a plain predicate over that list. `unknown`
/// keeps the case compatible with the kernel's `VerifyOptions<unknown, unknown>`.
const rowInvariant = (
  rows: unknown,
  invariant: string,
  oracle: (rows: unknown) => boolean,
): VerifyOptions<unknown, unknown> => ({
  execute: () => rows,
  invariant,
  observe: (value: unknown) => value,
  oracle,
});

export {
  applyMigrations,
  createSharedDb,
  createTestDb,
  openDbWithMigrations,
  parseJournalEntries,
  removeMigrationsFolder,
  rowInvariant,
  sliceMigrationsFolder,
  type DbFixture,
};
