import { defineRelations } from 'drizzle-orm';

import * as schema from './schema';

const relations = defineRelations(schema, (helpers) => ({
  account: {
    user: helpers.one.user({
      from: helpers.account.userId,
      to: helpers.user.id,
    }),
  },
  session: {
    user: helpers.one.user({
      from: helpers.session.userId,
      to: helpers.user.id,
    }),
  },
  user: {
    accounts: helpers.many.account(),
    sessions: helpers.many.session(),
  },
}));

export { relations };
