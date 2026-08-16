import { Context, Effect, type Cause } from 'effect';

import { D1, getDB } from '../db';
import { features as featuresTable } from '../db/schema';

export class FeaturesService extends Context.Service<
  FeaturesService,
  {
    readonly list: () => Effect.Effect<
      (typeof featuresTable.$inferSelect)[],
      Cause.UnknownError,
      D1
    >;
  }
>()('gstack/server/services/FeaturesService') {}

export const FeaturesServiceLive = FeaturesService.of({
  list: Effect.fn('FeaturesService.list')(function* (): Effect.fn.Return<
    (typeof featuresTable.$inferSelect)[],
    Cause.UnknownError,
    D1
  > {
    const d1 = yield* D1;
    const db = getDB(d1);
    return yield* Effect.tryPromise(() =>
      db.select().from(featuresTable).orderBy(featuresTable.sortOrder),
    );
  }),
});
