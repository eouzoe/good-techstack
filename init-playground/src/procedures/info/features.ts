import { os } from '../../server/os';
import { FeaturesService } from '../../server/services/features';

export const features = os.info.features.effect(function* () {
  const service = yield* FeaturesService;
  return yield* service.list();
});
