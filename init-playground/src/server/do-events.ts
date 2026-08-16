import { DurablePublisherObject } from '@orpc/cloudflare';

import type { WebsiteEnv } from '../../alchemy.run';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_CLEANUP_INTERVAL = 6;
const CLEANUP_INTERVAL_SECONDS = HOURS_PER_CLEANUP_INTERVAL * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
const RESUME_POLL_MINUTES = 5;
const RESUME_POLL_SECONDS = RESUME_POLL_MINUTES * SECONDS_PER_MINUTE;

export class EventsDO extends DurablePublisherObject<WebsiteEnv> {
  constructor(ctx: DurableObjectState, env: WebsiteEnv) {
    super(ctx, env, {
      resume: {
        cleanupIntervalSeconds: CLEANUP_INTERVAL_SECONDS,
        enabled: true,
        seconds: RESUME_POLL_SECONDS,
      },
    });
  }
}

export type TEventsDO = typeof EventsDO;
