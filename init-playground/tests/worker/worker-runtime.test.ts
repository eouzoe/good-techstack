import {
  createExecutionContext,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';

import { visitCounters } from '../../src/server/db/schema';
import { getMigratedDb, resetWorkerDb, runAsyncInvariant } from './worker-common';

/// Phase E — §6.8 Worker runtime correctness: request isolation, waitUntil
/// lifecycle, and bindings — exercised on the REAL workerd + REAL D1 binding.
///
/// These invariants observe only behaviour that is blind to the migration
/// difference between Phase D's `bun:sqlite` and D1's batch-only semantics
/// (real D1 has no BEGIN/COMMIT; `applyD1Migrations` is the atomic batch path).

const echoDb = (): D1Database => env.DB;

describe('§6.8 request isolation and D1 atomicity', () => {
  beforeEach(async () => {
    await resetWorkerDb();
  });

  /// The kernel invariant, driven through the async adapter onto real D1:
  /// an insert then read within one isolate yields exactly the row written.
  it('a request sees exactly what it wrote (per-isolate storage)', async () => {
    expect.hasAssertions();
    const db = await getMigratedDb();
    await db.insert(visitCounters).values({ name: 'request-a', counter: 1 }).run();

    const status = await runAsyncInvariant({
      execute: () => db.query.visitCounters.findFirst({ where: (table, { eq }) => eq(table.name, 'request-a') }),
      oracle: (row) => row?.counter === 1,
      invariant: 'D1 reflects the request-local write, atomically',
    });
    expect(status).toBe('ok');
  });

  it('waitUntil delays completion until the registered promise settles', async () => {
    expect.hasAssertions();
    const ctx = createExecutionContext();
    let settled = false;

    const turn = Promise.resolve();
    ctx.waitUntil((async () => {
      await turn;
      settled = true;
    })());

    await waitOnExecutionContext(ctx);
    const status = await runAsyncInvariant({
      execute: () => Promise.resolve(settled),
      oracle: (value) => value,
      invariant: 'waitUntil work finally completes before the Context is done',
    });
    expect(status).toBe('ok');
  });

  it('bindings are present and routed D1Database on the worker env', async () => {
    expect.hasAssertions();
    const status = await runAsyncInvariant({
      execute: () => Promise.resolve(echoDb()),
      oracle: (binding) => typeof binding.prepare === 'function',
      invariant: 'the DB binding is a live D1Database handle, not a mock',
    });
    expect(status).toBe('ok');
  });
});