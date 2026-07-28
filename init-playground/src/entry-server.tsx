import { dispose } from '@logtape/logtape';
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';

import { createAuth } from './server/auth';
import { type AppEnv } from './server/env';
import { handleRPC } from './server/rpc';

const startHandler = createStartHandler(defaultStreamHandler);

/// Edge routing boundary: three responsibilities, three prefixes.
///
/// - `/api/auth/*` — better-auth owns authentication entirely.
/// - `/api/rpc/*`  — oRPC owns the RPC protocol.
/// - `/*`          — TanStack Start owns SSR.
///
/// API routes are branched before the SSR handler so their request bodies are
/// never consumed by `startHandler` (see Cloudflare's fetch-adapter routing
/// guidance for the Worker fetch boundary).
const workerEntry = {
  async fetch(request: Request, env: AppEnv, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/auth')) {
      return createAuth(env).handler(request);
    }
    if (url.pathname.startsWith('/api/rpc')) {
      return handleRPC(request, env);
    }

    const response = await startHandler(request);
    ctx.waitUntil(dispose());
    return response;
  },
};

export { EventsDO } from './server/do-events';
export default workerEntry;
