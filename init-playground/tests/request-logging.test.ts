import { getLogger, withConfig, type LogRecord } from '@logtape/logtape';
import { describe, expect, it } from 'vitest';

import { serveWithRequestLog } from '../src/server/logging';

/// OBSERVABILITY Phase A — the request id convention on the fetch boundary.
///
/// Each case runs the boundary under a scoped LogTape config whose only sink
/// captures records, so the assertions read the structured `properties`
/// instead of parsing formatted console text — the same properties that reach
/// Workers Logs as JSON fields in production.

const pendingWaits: Promise<unknown>[] = [];

const PASS_THROUGH_CONTEXT = {
  waitUntil: (promise: Promise<unknown>): void => {
    pendingWaits.push(promise);
  },
};

const withCapture = <TResult>(
  run: () => Promise<TResult>,
  records: LogRecord[],
): Promise<TResult> =>
  withConfig(
    {
      loggers: [{ category: ['gstack'], lowestLevel: 'debug', sinks: ['capture'] }],
      sinks: {
        capture: (record) => {
          records.push(record);
        },
      },
    },
    run,
  );

const requestLineOf = (records: LogRecord[]): LogRecord | undefined =>
  records.find((record) => record.category.join('.') === 'gstack.request');

describe('request logging — request id convention (OBSERVABILITY Phase A)', () => {
  it('mints a request id when the caller sends none', async () => {
    expect.hasAssertions();
    const records: LogRecord[] = [];
    const response = await withCapture(
      () =>
        serveWithRequestLog(
          new Request('https://gstack.test/api/rpc/ping'),
          PASS_THROUGH_CONTEXT,
          () => Promise.resolve(new Response('pong')),
        ),
      records,
    );
    const requestId = response.headers.get('x-request-id');
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/u);
    expect(requestLineOf(records)?.properties).toMatchObject({
      path: '/api/rpc/ping',
      requestId,
      status: 200,
    });
  });

  it('forwards an inbound request id instead of minting one', async () => {
    expect.hasAssertions();
    const records: LogRecord[] = [];
    const response = await withCapture(
      () =>
        serveWithRequestLog(
          new Request('https://gstack.test/api/rpc/ping', {
            headers: { 'x-request-id': 'req-inbound' },
          }),
          PASS_THROUGH_CONTEXT,
          () => Promise.resolve(new Response('pong')),
        ),
      records,
    );
    expect(response.headers.get('x-request-id')).toBe('req-inbound');
    expect(requestLineOf(records)?.properties.requestId).toBe('req-inbound');
  });

  it('binds the id into nested logs through context-local storage', async () => {
    expect.hasAssertions();
    const records: LogRecord[] = [];
    await withCapture(
      () =>
        serveWithRequestLog(
          new Request('https://gstack.test/guide', { headers: { 'x-request-id': 'req-nested' } }),
          PASS_THROUGH_CONTEXT,
          () => {
            getLogger('gstack').info('nested work');
            return Promise.resolve(new Response('ok'));
          },
        ),
      records,
    );
    const nested = records.find((record) => record.rawMessage === 'nested work');
    expect(nested?.properties.requestId).toBe('req-nested');
  });

  it('logs one correlated error line and rethrows when the handler fails', async () => {
    expect.hasAssertions();
    const records: LogRecord[] = [];
    await expect(
      withCapture(
        () =>
          serveWithRequestLog(
            new Request('https://gstack.test/api/rpc/ping', {
              headers: { 'x-request-id': 'req-boom' },
            }),
            PASS_THROUGH_CONTEXT,
            () => Promise.reject(new Error('handler exploded')),
          ),
        records,
      ),
    ).rejects.toThrow('handler exploded');
    const failures = records.filter((record) => record.level === 'error');
    expect(failures).toHaveLength(1);
    expect(failures[0]?.properties).toMatchObject({
      error: 'handler exploded',
      requestId: 'req-boom',
    });
  });
});
