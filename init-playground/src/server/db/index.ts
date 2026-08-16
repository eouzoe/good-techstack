import { type DrizzleD1Database, drizzle } from 'drizzle-orm/d1';
import { Context } from 'effect';

import { relations } from './relations';

/// D1 binding as an Effect service tag. The composition root
/// (`effectContext(env)` in os.ts) provides the live binding; services yield
/// this tag to reach the database, so tests can swap in a mock D1.
export class D1 extends Context.Service<D1, D1Database>()('gstack/D1') {}

const getDB = (binding: D1Database): DrizzleD1Database<typeof relations> =>
  drizzle(binding, { relations });

export { getDB };
