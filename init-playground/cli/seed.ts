import { Database } from 'bun:sqlite';
import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { boolean, command, run, string } from '@drizzle-team/brocli';

import { getLocalDb } from '../src/server/db/local';
import { features, techs } from '../src/server/db/schema';

type LocalDb = ReturnType<typeof getLocalDb>;

const FEATURES_SEED = [
  {
    description: 'Runtime, package manager, test runner',
    icon: '🚀',
    sortOrder: 1,
    title: 'Bun',
  },
  {
    description: 'Type-safe HTTP and RPC layer',
    icon: '🔗',
    sortOrder: 2,
    title: 'Hono + oRPC',
  },
  { description: 'Serverless SQLite', icon: '🗄️', sortOrder: 3, title: 'Drizzle ORM + D1' },
  {
    description: 'Auth with email, OAuth, SSO',
    icon: '🔐',
    sortOrder: 4,
    title: 'better-auth',
  },
  { description: 'SSR with React', icon: '⚛️', sortOrder: 5, title: 'TanStack Start' },
  { description: 'Lightning-fast build tool', icon: '⚡', sortOrder: 6, title: 'Vite' },
];

const TECHS_SEED = [
  {
    description: 'Modular schema validation',
    name: 'Valibot',
    sortOrder: 1,
    url: 'https://valibot.dev',
    version: '1.4',
  },
  {
    description: 'Structured logging',
    name: 'LogTape',
    sortOrder: 2,
    url: 'https://logtape.org',
    version: '2.2',
  },
  {
    description: 'Utility-first CSS',
    name: 'Tailwind CSS',
    sortOrder: 3,
    url: 'https://tailwindcss.com',
    version: '4',
  },
];

const isAlreadySeeded = (db: LocalDb): boolean => db.select().from(features).all().length > 0;

const clearTables = (db: LocalDb): void => {
  db.delete(features).run();
  db.delete(techs).run();
};

const seedTables = (db: LocalDb): void => {
  db.insert(features).values(FEATURES_SEED).run();
  db.insert(techs).values(TECHS_SEED).run();
};

const seedDevDb = (opts: { force?: boolean }): void => {
  const db = getLocalDb();
  if (isAlreadySeeded(db) && opts.force !== true) {
    console.log('Database already seeded. Use --force to re-seed.');
    return;
  }
  if (opts.force === true) {
    clearTables(db);
  }
  seedTables(db);
  console.log('Seed complete: 6 features + 3 techs inserted.');
};

const seedAlchemyD1 = (): void => {
  const dir = join(process.cwd(), '.alchemy/local/d1/cloudflare-runtime-D1DatabaseObject');
  if (!existsSync(dir)) {
    console.log('alchemy local D1 not found — skipping');
    return;
  }
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.sqlite') || file === 'metadata.sqlite') {
      continue;
    }
    const db = new Database(join(dir, file));
    const existing = db.query('SELECT COUNT(*) AS c FROM features').get() as { c: number };
    if (existing.c > 0) {
      console.log(`alchemy D1 ${file}: already seeded`);
      db.close();
      continue;
    }
    const insertFeature = db.prepare(
        'INSERT INTO features (title, description, icon, sort_order) VALUES (?, ?, ?, ?)',
      ),
      insertTech = db.prepare(
        'INSERT INTO techs (name, description, url, version, sort_order) VALUES (?, ?, ?, ?, ?)',
      );
    for (const f of FEATURES_SEED) {
      insertFeature.run(f.title, f.description, f.icon, f.sortOrder);
    }
    for (const t of TECHS_SEED) {
      insertTech.run(t.name, t.description, t.url, t.version, t.sortOrder);
    }
    db.close();
    console.log(
      `alchemy D1 ${file}: seeded (${FEATURES_SEED.length} features, ${TECHS_SEED.length} techs)`,
    );
  }
};

const seedLocalSnapshot = (opts: { force?: boolean; snapshot?: string }): void => {
  const snapshotPath = opts.snapshot ?? '.dev.snapshot.db';
  try {
    if (opts.force === undefined) {
      seedDevDb({});
    } else {
      seedDevDb({ force: opts.force });
    }
  } catch (error) {
    console.log(
      `gstack.db not available — skipping (alchemy D1 still seeded): ${(error as Error).message}`,
    );
  }
  seedAlchemyD1();
  if (!existsSync(snapshotPath) || opts.force === true) {
    copyFileSync('gstack.db', snapshotPath);
    console.log(`Snapshot saved to ${snapshotPath}`);
  }
};

const buildLocalOpts = (
  force: boolean | undefined,
  snapshot: string | undefined,
): { force?: boolean; snapshot?: string } => {
  const local: { force?: boolean; snapshot?: string } = {};
  if (force !== undefined) {
    local.force = force;
  }
  if (snapshot !== undefined) {
    local.snapshot = snapshot;
  }
  return local;
};

const seed = command({
  handler: (opts) => {
    const env = opts.env ?? 'dev';
    console.log(`Seeding database: env=${env}`);

    if (env === 'dev') {
      seedLocalSnapshot(buildLocalOpts(opts.force, opts.snapshot));
      return;
    }

    // Production seeding would use wrangler d1 execute or HTTP API
    console.log(
      `WARNING: D1 remote seed not implemented. Use 'wrangler d1 execute' for env=${env}.`,
    );
  },
  name: 'seed',
  options: {
    env: string().desc('Target environment (dev/prod)'),
    force: boolean().desc('Re-seed even if already seeded').default(false),
    snapshot: string().desc('Path to snapshot file (copied to gstack.db for persistence)'),
  },
});

await run([seed]);
