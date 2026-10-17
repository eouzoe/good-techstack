import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';

import { createAuth } from './server/auth';
import { type AppEnv } from './server/env';
import { serveWithRequestLog } from './server/logging';
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
/// guidance for the Worker fetch boundary). Every branch runs inside
/// `serveWithRequestLog`, so one request id scopes all of them.
const workerEntry = {
  fetch(request: Request, env: AppEnv, ctx: ExecutionContext) {
    return serveWithRequestLog(request, ctx, () => {
      const url = new URL(request.url);

      if (url.pathname.startsWith('/api/auth')) {
        return createAuth(env).handler(request);
      }
      if (url.pathname.startsWith('/api/rpc')) {
        return handleRPC(request, env);
      }

      return startHandler(request);
    });
  },
};

export { EventsDO } from './server/do-events';
export default workerEntry;
