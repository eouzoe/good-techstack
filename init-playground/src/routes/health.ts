import { createFileRoute } from '@tanstack/react-router';
import { env } from 'cloudflare:workers';

import { checkHealth, HEALTH_HTTP_STATUS } from '../server/health';

/// Server route (plain HTTP contract, not a server function): the deploy stage
/// and the devenv readiness probe hit this endpoint. It reports whether the
/// Worker answers and whether the D1 binding answers back; edge availability
/// never reaches the Worker and stays Cloudflare's concern.
///
/// `no-store` keeps probes uncached, so a stale `ok` cannot mask a degraded
/// binding.
export const Route = createFileRoute('/health')({
  server: {
    handlers: {
      GET: async () => {
        const report = await checkHealth(env.DB);
        return Response.json(report, {
          headers: { 'cache-control': 'no-store' },
          status: HEALTH_HTTP_STATUS[report.status],
        });
      },
    },
  },
});
