import { Database } from 'bun:sqlite';

import { drizzle } from 'drizzle-orm/bun-sqlite';

import { features, techs, visitCounters } from './schema';

const DB_PATH = process.env.LOCAL_DB_PATH ?? 'gstack.db';
const dbSchema = { features, techs, visitCounters };

let localDb: ReturnType<typeof drizzle<typeof dbSchema>> | null = null;

const getLocalDb = () => {
  if (localDb) {
    return localDb;
  }
  const sqlite = new Database(DB_PATH, { create: true });
  sqlite.run('PRAGMA journal_mode = WAL;');
  sqlite.run('PRAGMA foreign_keys = ON;');
  localDb = drizzle(sqlite, { schema: dbSchema });
  return localDb;
};

export { getLocalDb };
