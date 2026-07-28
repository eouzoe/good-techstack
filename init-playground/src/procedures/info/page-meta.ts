import { os } from '../../server/os';

export const pageMeta = os.info.pageMeta.handler(() => ({
  description:
    'Ship products on Cloudflare Workers with Bun, Hono, oRPC, Drizzle, better-auth, and TanStack Start.',
  title: 'gstack — opinionated full-stack template',
}));
