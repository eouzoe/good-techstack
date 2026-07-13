import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

export function createDb(database: D1Database): Database {
  return drizzle(database, { schema });
}
