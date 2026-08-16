import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';

import { features as featuresTable } from '../../src/server/db/schema';
import { handleRPC } from '../../src/server/rpc';
import { getMigratedDb, resetWorkerDb, runAsyncInvariant } from './worker-common';

/// Phase E — §6.5/§6.9 request boundary on real workerd: the production
/// `handleRPC` (oRPC) → router proc → Valibot(contract) → Drizzle(`getDB`)
/// → REAL D1 binding, driven exactly as production does via a POST to
/// `/api/rpc/info/features`. This is the vertical slice that Phase D could only
/// emulate with `bun:sqlite`; here it runs on the actual Workers runtime.
///
/// The wire envelope is oRPC's success shape (`{ json: <output> }`), observed
/// rather than asserted, so the invariant stays on what the contract promises.

describe('§6.9 RPC request boundary through real D1', () => {
  beforeEach(async () => {
    await resetWorkerDb();
  });

  it('serves a D1-backed feature list through oRPC', async () => {
    expect.hasAssertions();
    const db = await getMigratedDb();
    await db.insert(featuresTable).values({ title: 't', description: 'd', icon: 'i' }).run();

    const status = await runAsyncInvariant({
      execute: async (): Promise<unknown> => {
        const res = await handleRPC(
          new Request('http://test/api/rpc/info/features', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{}',
          }),
          env,
        );
        const payload = (await res.json()) as { json: unknown };
        return payload.json;
      },
      oracle: (rows) => {
        const list = rows as { title: string }[] | undefined;
        return Array.isArray(list) && list.length === 1 && list[0]?.title === 't';
      },
      invariant: 'oRPC proxies the D1 row through contract validation to JSON',
    });
    expect(status).toBe('ok');
  });

  it('surfaces an Effect typed failure as a NOT_FOUND error envelope', async () => {
    expect.hasAssertions();
    const res = await handleRPC(
      new Request('http://test/api/rpc/info/techs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
      env,
    );
    expect(res.status).toBe(404);
    const payload = (await res.json()) as {
      json: { code?: string; message?: string } | undefined;
    };
    expect(payload.json?.code).toBe('NOT_FOUND');
    expect(payload.json?.message).toBe('No technologies found');
  });

  it('serves the static pageMeta procedure through oRPC', async () => {
    expect.hasAssertions();
    const res = await handleRPC(
      new Request('http://test/api/rpc/info/pageMeta', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
      env,
    );
    expect(res.status).toBe(200);
    const payload = (await res.json()) as { json: { title?: string } | undefined };
    expect(payload.json?.title).toBe('gstack — opinionated full-stack template');
  });

  it('streams the events procedure as SSE', async () => {
    expect.hasAssertions();
    const res = await handleRPC(
      new Request('http://test/api/rpc/info/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
      env,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream');
    const reader = res.body?.getReader();
    expect(reader).toBeDefined();
    await reader?.cancel();
  }, 15_000);

  it('emits a first SSE event chunk with the contract shape', async () => {
    expect.hasAssertions();
    const res = await handleRPC(
      new Request('http://test/api/rpc/info/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
      env,
    );
    expect(res.status).toBe(200);
    const reader = res.body?.getReader();
    expect(reader).toBeDefined();
    const first = await reader!.read();
    const second = await reader!.read();
    await reader!.cancel();
    let buffer = '';
    const decoder = new TextDecoder();
    if (first.value !== undefined) {
      buffer += decoder.decode(first.value as Uint8Array, { stream: true });
    }
    if (second.value !== undefined) {
      buffer += decoder.decode(second.value as Uint8Array, { stream: true });
    }
    expect(buffer).toContain('data:');
    expect(buffer).toContain('event:');
  }, 15_000);
});
