import { better } from 'better-drizzle';

import { getDB } from './index';

/// better-drizzle client over the production D1 binding. Single-table reads
/// in services go through here (`findMany` keeps the row order the old
/// `select().from().orderBy()` produced). better-auth's `drizzleAdapter`
/// keeps the raw drizzle handle — it requires a drizzle instance, not a
/// better client.
const getBetterDb = (binding: D1Database) => better(getDB(binding));

export { getBetterDb };
