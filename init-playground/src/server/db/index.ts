import { type DrizzleD1Database, drizzle } from 'drizzle-orm/d1';

import { features, techs, visitCounters } from './schema';

const dbSchema = { features, techs, visitCounters };

const getDB = (binding: D1Database): DrizzleD1Database<typeof dbSchema> =>
  drizzle(binding, { schema: dbSchema });

export { getDB };
