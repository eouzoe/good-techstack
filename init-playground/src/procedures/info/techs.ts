import { Effect } from 'effect';

import { os } from '../../server/os';
import { TechsService } from '../../server/services/techs';

export const techs = os.info.techs.effect(function* ({ errors }) {
  const service = yield* TechsService;
  return yield* service.list().pipe(
    Effect.catchTag('TechsNotFoundError', () =>
      Effect.fail(errors.NOT_FOUND()),
    ),
  );
});
