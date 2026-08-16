import { Context, Data, Effect, type Cause } from 'effect';

import { D1, getDB } from '../db';
import { techs as techsTable } from '../db/schema';

/// Expected failure: an empty technologies table. Procedures translate this
/// into the transport error (`NOT_FOUND`) so the domain layer never depends on
/// HTTP concerns.
export class TechsNotFoundError extends Data.TaggedError('TechsNotFoundError') {}

export class TechsService extends Context.Service<
  TechsService,
  {
    readonly list: () => Effect.Effect<
      (typeof techsTable.$inferSelect)[],
      TechsNotFoundError | Cause.UnknownError,
      D1
    >;
  }
>()('gstack/server/services/TechsService') {}

export const TechsServiceLive = TechsService.of({
  list: Effect.fn('TechsService.list')(function* (): Effect.fn.Return<
    (typeof techsTable.$inferSelect)[],
    TechsNotFoundError | Cause.UnknownError,
    D1
  > {
    const d1 = yield* D1;
    const db = getDB(d1);
    const rows = yield* Effect.tryPromise(() =>
      db.select().from(techsTable).orderBy(techsTable.sortOrder),
    );
    if (rows.length === 0) {
      return yield* Effect.fail(new TechsNotFoundError());
    }
    return rows;
  }),
});
