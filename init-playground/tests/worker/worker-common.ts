import { applyD1Migrations } from 'cloudflare:test';
import { env } from 'cloudflare:workers';

import { getDB } from '../../src/server/db/index';
import { runSuite } from '../../src/verification/suite';

/// Phase E — Worker boundary adapter (pure, no kernel mutation, §1.15).
///
/// The kernel's `verify()` is synchronous; D1 is inherently async. So the
/// Worker adapter pins the SAME semantic shape (execute → observe → oracle →
/// invariant) but lets each stage be a promise, then drives it through the
/// kernel's `runSuite`. The kernel stays pure; the boundary adapts.
///
/// Migrations: we intentionally do NOT import `readD1Migrations` from
/// `@cloudflare/vitest-pool-workers` (the pool module). That module pulls the
/// pool-side Node/wrangler graph into the test isolate, which crashes workerd
/// (segfault) at module-load time. The public docs route `readD1Migrations`
/// through the `@cloudflare/vitest-pool-workers/config` subpath, which this
/// v0.20 build does not export. So we replicate the splitter locally: drizzle
/// emits `--> statement-breakpoint` between statements, so each migration is a
/// sequence of trimmed, comment-stripped statements. They are applied through
/// `applyD1Migrations`, the D1-native tracking table (`d1_migrations`), NOT the
/// `bun:sqlite` migrator used by Phase D. This is the D1-semantics fix from the
/// Phase E kickoff card: real D1 has no `BEGIN`/`COMMIT` — batch is the
/// atomicity primitive, and `applyD1Migrations` exercises that path.
///
/// Note: D1 query values are returned as `unknown`/`null` typed per D1Database,
/// and numeric columns come back as numbers, so the invariants here observe
/// through the relational API (drizzle) rather than raw integers.

interface D1Migration {
  name: string;
  queries: string[];
}

/// Drizzle emits `--> statement-breakpoint` between statements; each migration
/// is those chunks trimmed and comment-stripped (the trailing `;` is fine for
/// D1).
const splitSql = (sql: string): string[] =>
  sql
    .split('--> statement-breakpoint')
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);

let migrationsPromise: Promise<D1Migration[]> | undefined;

const loadMigrations = (): Promise<D1Migration[]> => {
  migrationsPromise ??= (async () => {
    const [rawInit, rawInviteCounters, rawAuthTables, rawDropIssuer] = await Promise.all([
      import('../../../drizzle/20260805204740_init/migration.sql?raw').then(
        (module) => module.default,
      ),
      import('../../../drizzle/20260805204942_invite-counters/migration.sql?raw').then(
        (module) => module.default,
      ),
      import('../../../drizzle/20260819065621_auth-tables/migration.sql?raw').then(
        (module) => module.default,
      ),
      import('../../../drizzle/20261013194054_unknown_betty_brant/migration.sql?raw').then(
        (module) => module.default,
      ),
    ]);
    return [
      { name: '20260805204740_init.sql', queries: splitSql(rawInit) },
      { name: '20260805204942_invite-counters.sql', queries: splitSql(rawInviteCounters) },
      { name: '20260819065621_auth-tables.sql', queries: splitSql(rawAuthTables) },
      { name: '20261013194054_unknown_betty_brant.sql', queries: splitSql(rawDropIssuer) },
    ];
  })();
  return migrationsPromise;
};

type MigratedDb = ReturnType<typeof getDB>;

let dbPromise: Promise<MigratedDb> | undefined;

/// Migrated, real-workerd D1 handle bound in the Drizzle model layer through
/// the production `getDB()` (the same path `src/server/rpc.ts` uses for the
/// fetch handlers). `env.DB` is the actual `DB` binding; each test FILE gets
/// isolated storage (vitest-pool-workers default), so migrations applied here
/// never leak across files.
const getMigratedDb = (): Promise<MigratedDb> => {
  dbPromise ??= (async () => {
    const migrations = await loadMigrations();
    await applyD1Migrations(env.DB, migrations);
    return getDB(env.DB);
  })();
  return dbPromise;
};

/// Reset storage between tests within a file. vitest-pool-workers isolates per
/// FILE, so cross-file state is already safe; this only guarantees within-file
/// order independence (§6.8 request isolation). Migrations are ensured first so
/// the DELETE statements target existing tables regardless of call order.
const resetWorkerDb = async (): Promise<void> => {
  await getMigratedDb();
  dbPromise = undefined;
  await env.DB.exec(
    'DELETE FROM verification; DELETE FROM session; DELETE FROM account; DELETE FROM user; DELETE FROM visit_counters; DELETE FROM techs; DELETE FROM features;',
  );
};

interface AsyncInvariant<TValue, TObservation> {
  execute: () => Promise<TValue>;
  observe?: (value: TValue) => Promise<TObservation>;
  oracle: (observation: TObservation) => boolean;
  invariant: string;
}

/// Drives one async invariant through the kernel's `runSuite`. `observe` is
/// identity by default (the observation IS the executed value, like Phase D's
/// bun:sqlite adapter).
const runAsyncInvariant = async <TValue, TObservation = TValue>(
  options: AsyncInvariant<TValue, TObservation>,
): Promise<'ok' | 'failed'> => {
  const {
    execute,
    observe = (value: TValue): Promise<TObservation> =>
      Promise.resolve(value as unknown as TObservation),
    oracle,
    invariant,
  } = options;
  const observed = await observe(await execute());
  const suite = runSuite([
    {
      execute: () => observed,
      observe: (value: unknown): unknown => value,
      oracle: (observation: unknown): boolean => oracle(observation as TObservation),
      invariant,
    },
  ]);
  return suite.status;
};

export { getMigratedDb, resetWorkerDb, runAsyncInvariant };
