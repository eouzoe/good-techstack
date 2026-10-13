/// Alchemy entrypoint — the IaC layer that replaces `wrangler.jsonc` for
/// deployments. Modeled on the official `cloudflare-tanstack-rpc-drizzle`
/// example: a single async (plain-fetch) Worker hosting the TanStack Start
/// app plus the `EventsDO` Durable Object, with all bindings declared via the
/// `env` prop (the authoritative shape for async Workers in alchemy v2).
///
/// Only bindings the server code actually consumes are declared. R2, Queues,
/// Send Email, Turnstile and Web Analytics lived in `wrangler.jsonc` but had
/// no references under `src/` — they were dropped rather than carried over.
import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';

import { type EventsDO } from './src/server/do-events';

export const Website = Cloudflare.Website.Vite('Website', {
  /// `main` overrides the deployed Worker entry. TanStack Start's own bundle
  /// only exports a fetch handler, but this Worker must also export the
  /// `EventsDO` Durable Object class — so point it at the custom entry that
  /// re-exports both.
  main: './src/entry-server.tsx',
  compatibility: { flags: ['nodejs_compat'] },
  /// Workers Observability is on by default for logs; the explicit prop keeps
  /// traces (new `traces` channel) enabled and persists both so the template
  /// demonstrates the full dashboard / OTLP surface. Field names match the
  /// Cloudflare API (camelCased).
  observability: {
    enabled: true,
    headSamplingRate: 1,
    logs: {
      enabled: true,
      invocationLogs: true,
      headSamplingRate: 1,
      persist: true,
    },
    traces: {
      enabled: true,
      headSamplingRate: 1,
      persist: true,
    },
  },
  env: {
    BETTER_AUTH_SECRET: Config.Redacted('BETTER_AUTH_SECRET'),
    BETTER_AUTH_URL: Config.String('BETTER_AUTH_URL'),
    USE_MOCKS: Config.withDefault(Config.String('USE_MOCKS'), 'false'),
    DB: Cloudflare.D1.Database('DB', {
      // alchemy 2.0-beta.74: unified `migrations` prop (was migrationsDir/Table)
      migrations: { dir: './drizzle', table: 'drizzle_migrations' },
    }),
    KV: Cloudflare.KV.Namespace('KV'),
    /// Self-hosted: the class is exported from this Worker's own entry, so
    /// no `scriptName` is needed — only the `className` must match.
    EVENTS_DO: Cloudflare.DurableObject<EventsDO>('EVENTS_DO', { className: 'EventsDO' }),
    RATELIMIT: Cloudflare.RateLimit('RATELIMIT', {
      namespaceId: 1001,
      simple: { limit: 30, period: 60 },
    }),
  },
});

export type WebsiteEnv = Cloudflare.InferEnv<typeof Website>;

/// `Alchemy.localState()` keeps plan state under `.alchemy/` — zero-bootstrap
/// and right for the single-developer, manual-deploy workflow of this template.
/// Swap for `Cloudflare.state()` (or `Alchemy.inMemoryState()`) when CI needs a
/// shared state store.
export default Alchemy.Stack(
  'gstack',
  { providers: Cloudflare.providers(), state: Alchemy.localState() },
  Effect.gen(function* () {
    const website = yield* Website;
    return { websiteUrl: website.url.as<string>() };
  }),
);
