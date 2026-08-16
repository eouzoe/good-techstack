import { type InferSchemaInput } from '@orpc/contract';
import { withEventMeta } from '@orpc/server';
import { Effect, Stream } from 'effect';

import { type eventSchema } from '#shared/contracts/index';

import { os } from '../../server/os';

type EventOutput = InferSchemaInput<typeof eventSchema>;

const NOTIFICATION_INTERVAL = 3;

const NOTIFICATION_RETRY_MS = 5000;

const STREAM_INTERVAL_MS = 3000;

const eventFor = (count: number): EventOutput => {
  if (count % NOTIFICATION_INTERVAL === 0) {
    return withEventMeta(
      {
        data: {
          message: 'All systems operational',
          severity: 'info',
          title: 'Server Status Update',
        },
        type: 'notification',
      },
      { id: `notif-${count}`, retry: NOTIFICATION_RETRY_MS },
    );
  }
  return withEventMeta(
    {
      data: {
        iso: new Date().toISOString(),
        unix: Date.now(),
      },
      type: 'timestamp',
    },
    { id: `ts-${count}` },
  );
};

/// Effect-native event stream: the oRPC effect handler runs this under
/// `Effect.runPromiseExit(..., { signal })`, so a client disconnect interrupts
/// the `Stream` (structured concurrency) instead of leaking a timer.
export const events = os.info.events.effect(function* eventsGenerator() {
  const iterator = Stream.iterate(0, (count) => count + 1).pipe(
    Stream.map((count) => eventFor(count)),
    Stream.tap(() => Effect.sleep(STREAM_INTERVAL_MS)),
    Stream.toAsyncIterable,
    (iterable) => iterable[Symbol.asyncIterator](),
  );
  const asyncIteratorObject = {
    next: () => iterator.next(),
    async [Symbol.asyncDispose]() {
      if (iterator.return) {
        await iterator.return();
      }
    },
    [Symbol.asyncIterator]: () => asyncIteratorObject,
  };
  return yield* Effect.succeed(asyncIteratorObject);
});
