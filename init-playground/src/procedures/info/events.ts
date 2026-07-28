import { withEventMeta } from '@orpc/server';

import { os } from '../../server/os';

const NOTIFICATION_INTERVAL = 3;
const STREAM_INTERVAL_MS = 3000;
const NOTIFICATION_RETRY_MS = 5000;

export const events = os.info.events.handler(async function* events({ signal }) {
  let count = 0;
  for (;;) {
    signal?.throwIfAborted();

    if (count % NOTIFICATION_INTERVAL === 0) {
      yield withEventMeta(
        {
          data: {
            message: 'All systems operational',
            severity: 'info' as const,
            title: 'Server Status Update',
          },
          type: 'notification',
        },
        { id: `notif-${count}`, retry: NOTIFICATION_RETRY_MS },
      );
    } else {
      yield withEventMeta(
        {
          data: {
            iso: new Date().toISOString(),
            unix: Date.now(),
          },
          type: 'timestamp',
        },
        { id: `ts-${count}` },
      );
    }

    count++;
    // oxlint-disable-next-line no-await-in-loop, promise/avoid-new, no-promise-executor-return, typescript/strict-void-return -- intentional periodic delay for the event stream
    await new Promise<void>((resolve) => setTimeout(resolve, STREAM_INTERVAL_MS));
  }
});
