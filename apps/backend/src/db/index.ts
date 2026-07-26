import { drizzle } from 'drizzle-orm/d1';

export const createDb = (database: D1Database) => drizzle(database);
