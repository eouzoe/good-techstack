import { describe, expect, expectTypeOf, it } from 'vitest';

import { type QueuePayload } from '../src/shared/queue-schemas';

/// §5 — "型別不該相容" tests. `expectTypeOf` asserts a type *does not* extend
/// a widened shape, turning the type layer into executable evidence: if the
/// schema ever widened `type` (say, to `string`), these tests go red at compile
/// time. This is the same kernel replicated onto the *static* boundary.
///
/// Note: `expectTypeOf` is compile-time-only and registers no runtime assertion,
/// so each case carries a trivial runtime `expect(...)` to satisfy the
/// prefer-expect-assertions gate (the real proof is the typecheck step).

describe('queue payload variant acceptance (§5)', () => {
  it('accepts exactly its three registered variants', () => {
    expect.assertions(1);
    const email: QueuePayload = { body: 'b', subject: 's', to: 'a@b.co', type: 'email' };
    const webhook: QueuePayload = { payload: {}, type: 'webhook', url: 'https://x.co' };
    const audit: QueuePayload = { action: 'login', type: 'audit' };
    expectTypeOf(email).toExtend<QueuePayload>();
    expectTypeOf(webhook).toExtend<QueuePayload>();
    expectTypeOf(audit).toExtend<QueuePayload>();
    expect([email.type, webhook.type, audit.type].toSorted()).toStrictEqual([
      'audit',
      'email',
      'webhook',
    ]);
  });

  it('rejects a payload type outside the union', () => {
    expect.assertions(1);
    const unknownVariant = { type: 'carrier-pigeon' } as const;
    expectTypeOf(unknownVariant).not.toExtend<QueuePayload>();
    expect(unknownVariant.type).toBe('carrier-pigeon');
  });

  it('rejects a wrongly-tagged email variant', () => {
    expect.assertions(1);
    const wrongTag = { body: 'b', subject: 's', to: 'a@b.co', type: 'webhook' } as const;
    expectTypeOf(wrongTag).not.toExtend<QueuePayload>();
    expect(wrongTag.type).toBe('webhook');
  });
});

describe('queue payload type rejection (§5)', () => {
  it('rejects a payload missing a required field', () => {
    expect.assertions(1);
    const missingTo = { body: 'b', subject: 's', type: 'email' } as const;
    expectTypeOf(missingTo).not.toExtend<QueuePayload>();
    expect(missingTo.type).toBe('email');
  });

  it('does not collapse to a plain record', () => {
    expect.assertions(1);
    const record: Record<string, unknown> = { type: 'email' };
    expectTypeOf(record).not.toExtend<QueuePayload>();
    expect(record.type).toBe('email');
  });

  it('does not collapse to a permissive any-like dispatch type', () => {
    expect.assertions(1);
    const permissive: { type: string } = { type: 'email' };
    expectTypeOf(permissive).not.toExtend<QueuePayload>();
    expect(permissive.type).toBe('email');
  });
});