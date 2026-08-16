/// Augments the global `Cloudflare.Env` (from `@cloudflare/workers-types`)
/// with the bindings alchemy infers from `alchemy.run.ts`. This is what lets
/// `import { env } from 'cloudflare:workers'` type-check against the deployed
/// Worker — the official replacement for the `wrangler types`-generated
/// `worker-configuration.d.ts`.
import { type WebsiteEnv } from '../alchemy.run';

declare module 'cloudflare:workers' {
  namespace Cloudflare {
    interface Env extends WebsiteEnv {}
  }
}
