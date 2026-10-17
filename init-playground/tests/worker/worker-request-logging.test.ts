import { withConfig, type LogRecord } from '@logtape/logtape';
import { describe, expect, it } from 'vitest';

import { serveWithRequestLog } from '../../src/server/logging';

/// OBSERVABILITY Phase A in the real runtime: importing this module already
/// proves the Worker can load `node:async_hooks` AsyncLocalStorage, and the
/// assertions pin the context binding plus the `x-request-id` echo to workerd,
/// not just to the node-env suite.

const pendingWaits: Promise<unknown>[] = [];

const PASS_THROUGH_CONTEXT = {
  waitUntil: (promise: Promise<unknown>): void => {
    pendingWaits.push(promise);
  },
};

describe('request logging in the Workers runtime', () => {
  it('echoes the request id and logs a correlated request line', async () => {
    expect.hasAssertions();
    const records: LogRecord[] = [];
    const response = await withConfig(
      {
        loggers: [{ category: ['gstack'], lowestLevel: 'debug', sinks: ['capture'] }],
        sinks: {
          capture: (record) => {
            records.push(record);
          },
        },
      },
      () =>
        serveWithRequestLog(
          new Request('https://gstack.test/api/rpc/ping', {
            headers: { 'x-request-id': 'req-worker' },
          }),
          PASS_THROUGH_CONTEXT,
          () => Promise.resolve(new Response('pong')),
        ),
    );
    expect(response.headers.get('x-request-id')).toBe('req-worker');
    const line = records.find((record) => record.category.join('.') === 'gstack.request');
    expect(line?.properties).toMatchObject({ path: '/api/rpc/ping', requestId: 'req-worker' });
  });
});
