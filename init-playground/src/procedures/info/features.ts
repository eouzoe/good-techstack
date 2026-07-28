import { getDB } from '../../server/db/index';
import { features as featuresTable } from '../../server/db/schema';
import { os } from '../../server/os';

export const features = os.info.features.handler(({ context }) =>
  getDB(context.env.DB).select().from(featuresTable).orderBy(featuresTable.sortOrder),
);
