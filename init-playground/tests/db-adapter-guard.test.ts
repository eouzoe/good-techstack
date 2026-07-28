import { describe, expect, it } from 'vitest';

import { parseJournalEntries } from './db-common';

/// Phase D — adapter guard tests (meta-defense, §8.40 meta-query pattern).
///
/// The migration journal validator must REJECT malformed payloads: the guard
/// branches in `db-common.ts` are only reachable with corrupt input, so these
/// tests pin that the adapter refuses to slice a broken journal (otherwise the
/// whole §6.5 suite would silently run against a mis-read journal).

describe('db adapter journal guards (§6.5 meta)', () => {
  it('rejects a non-array entries payload', () => {
    expect.hasAssertions();
    expect(() => parseJournalEntries(null)).toThrow(/Invalid drizzle migration journal/u);
    expect(() => parseJournalEntries('not-an-array')).toThrow(/Invalid drizzle migration journal/u);
  });

  it('rejects an entry that is not an object', () => {
    expect.hasAssertions();
    expect(() => parseJournalEntries([42])).toThrow(/Invalid drizzle migration journal/u);
  });

  it('rejects an entry missing a string tag', () => {
    expect.hasAssertions();
    expect(() => parseJournalEntries([{ when: 1 }])).toThrow(/Invalid drizzle migration journal/u);
  });

  it('rejects an entry missing a numeric when', () => {
    expect.hasAssertions();
    expect(() => parseJournalEntries([{ tag: '0000_init' }])).toThrow(/Invalid drizzle migration journal/u);
  });

  it('rejects a mixed well-formed and malformed array in one payload', () => {
    expect.hasAssertions();
    expect(() =>
      parseJournalEntries([
        { tag: '0000_init', when: 1 },
        42,
        { tag: '0002_skip', when: 3 },
      ]),
    ).toThrow(/Invalid drizzle migration journal/u);
  });

  it('accepts a well-formed journal and preserves entry order', () => {
    expect.hasAssertions();
    const entries = parseJournalEntries([
      { tag: '0000_init', when: 1 },
      { tag: '0001_invite-counters', when: 2 },
    ]);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.tag).toBe('0000_init');
    expect(entries[1]?.tag).toBe('0001_invite-counters');
  });
});