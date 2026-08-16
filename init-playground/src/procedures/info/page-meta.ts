import { Effect } from 'effect';

import { os } from '../../server/os';

export const pageMeta = os.info.pageMeta.effect(function* () {
  return yield* Effect.succeed({
    description:
      'Ship products on Cloudflare Workers with Bun, Hono, oRPC, Drizzle, better-auth, and TanStack Start.',
    title: 'gstack — opinionated full-stack template',
  });
});
