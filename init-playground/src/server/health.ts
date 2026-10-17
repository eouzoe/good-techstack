import { sql } from 'drizzle-orm';

import { getDB } from './db';

/// Liveness probe for deploy-stage validation: the Worker answers and the D1
/// binding answers back. The probe runs the same Drizzle → D1 path as
/// production queries (`select 1`), so a green result means the request path
/// underneath every procedure is intact — not merely that the isolate booted.
///
/// The binding is injected rather than read from `env` here, so tests drive
/// both branches — reachable and unreachable — without a global mock.
///
/// The HTTP projection lives here too, so the route stays a thin adapter:
/// 200 = serving, 503 = the binding did not answer.

interface HealthReport {
  checks: { d1: 'ok' | 'unreachable' };
  status: 'ok' | 'degraded';
}

const HEALTH_HTTP_STATUS = { degraded: 503, ok: 200 } as const;

const probeD1 = async (database: D1Database): Promise<'ok' | 'unreachable'> => {
  try {
    await getDB(database).run(sql`select 1`);
    return 'ok';
  } catch {
    return 'unreachable';
  }
};

const checkHealth = async (database: D1Database): Promise<HealthReport> => {
  const d1 = await probeD1(database);
  if (d1 === 'unreachable') {
    return { checks: { d1 }, status: 'degraded' };
  }
  return { checks: { d1 }, status: 'ok' };
};

export { checkHealth, HEALTH_HTTP_STATUS };
export type { HealthReport };
