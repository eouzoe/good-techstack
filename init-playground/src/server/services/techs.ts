import { Result, TaggedError } from 'better-result';

import { getDB } from '../db';
import { techs as techsTable } from '../db/schema';

/// Domain layer (service boundary): expected business failures are modelled as
/// values, not throws, so call sites must handle them explicitly.
///
/// Procedures stay thin: they translate this Result into transport errors
/// (`errors.NOT_FOUND()`). As the product grows past 0→10 QPS, this is where
/// business rules and workflows accumulate.
// oxlint-disable-next-line unicorn/throw-new-error -- TaggedError is the better-result class factory, not a thrown error.
class TechsNotFoundError extends TaggedError('TechsNotFoundError') {}

const listTechs = async (env: { DB: D1Database }) => {
  const db = getDB(env.DB);
  const rows = await db.select().from(techsTable).orderBy(techsTable.sortOrder);
  if (rows.length === 0) {
    return Result.err(new TechsNotFoundError());
  }
  return Result.ok(rows);
};

export { TechsNotFoundError, listTechs };
