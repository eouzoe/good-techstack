import { Database } from 'bun:sqlite';

import { drizzle } from 'drizzle-orm/bun-sqlite';

import { relations } from './relations';

const DB_PATH = process.env.LOCAL_DB_PATH ?? 'gstack.db';

let localDb: ReturnType<typeof drizzle<typeof relations>> | null = null;

const getLocalDb = () => {
  if (localDb) {
    return localDb;
  }
  const sqlite = new Database(DB_PATH, { create: true });
  sqlite.run('PRAGMA journal_mode = WAL;');
  sqlite.run('PRAGMA foreign_keys = ON;');
  localDb = drizzle({ client: sqlite, relations });
  return localDb;
};

export { getLocalDb };
