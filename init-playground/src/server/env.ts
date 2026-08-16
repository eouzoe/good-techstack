import { Context } from 'effect';

import type { WebsiteEnv } from '../../alchemy.run';

export type AppEnv = WebsiteEnv;

/// The full Worker env (bindings + config) as an Effect service tag. RPC and
/// auth services yield this when they need raw bindings the `D1` tag doesn't
/// cover.
export class ServerEnv extends Context.Service<ServerEnv, AppEnv>()('gstack/ServerEnv') {}
