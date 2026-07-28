import alchemy from 'alchemy';
import {
  D1Database,
  DurableObjectNamespace,
  R2Bucket,
  RateLimit,
  TanStackStart,
} from 'alchemy/cloudflare';

/// Infrastructure-as-Code for the gstack template.
///
/// Define all Cloudflare resources in TypeScript.
/// Alchemy manages the full lifecycle — plan, deploy, destroy.
///
/// Usage:
///   bun alchemy deploy            # Sync infra to Cloudflare
///   bun alchemy destroy           # Teardown all resources
///   bun alchemy plan              # Preview changes
///
/// Must be run after `rsbuild build` so that dist/ exists.
const app = await alchemy('gstack', { stage: process.env.STAGE ?? 'dev' });

// ── Storage ──────────────────────────────────────────────
const db = await D1Database('gstack-db', {
  migrationsDir: './migrations',
  name: `gstack-${app.stage}-db`,
  primaryLocationHint: 'wnam',
});

const bucket = await R2Bucket('gstack-assets', {
  name: `gstack-${app.stage}-assets`,
});

// ── Stateful Compute ────────────────────────────────────
const eventsDO = DurableObjectNamespace('gstack-events', {
  className: 'EventsDO',
  scriptName: 'gstack',
  sqlite: true,
});

// ── Edge rate limiting (RPC procedures + auth boundary) ─
// oxlint-disable-next-line new-cap -- alchemy resource factory (not a constructor).
const rateLimit = RateLimit({
  namespace_id: 1001,
  simple: {
    limit: 30,
    period: 60,
  },
});

// ── Worker (TanStack Start) ─────────────────────────────
const worker = await TanStackStart('gstack-worker', {
  assets: 'dist/client',
  bindings: {
    DB: db,
    EVENTS_DO: eventsDO,
    R2: bucket,
    RATELIMIT: rateLimit,
  },
  build: {
    command: 'vite build',
    memoize: { patterns: ['./src/**', './vite.config.ts'] },
  },
  name: `gstack-${app.stage}`,
  observability: { enabled: true },
  url: true,
});

await app.finalize();

export { bucket, db, eventsDO, rateLimit, worker };
