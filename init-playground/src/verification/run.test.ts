import { describe, expect, it } from 'vitest';

import { VerificationFailed } from './result';
import { createRunId, runVerification } from './run';

const BALANCE_AFTER_DEPOSIT = 100;
const OK_INVARIANT = 'balance never drops below zero after a deposit';
const UUID_V4_LENGTH = 36;
const START_MS = 1_600_000_000_000;
const TICK_MS = 42;

interface TestClock {
  now: () => number;
  startedAt: number;
}

/// Fresh deterministic clock per test. Advances monotonically, so an inverted
/// `duration` (`startedAt - finishedAt`) computes a negative value no matter how
/// fast the two reads land — unlike wall clock, which can mask it at ms
/// resolution. The captured `startedAt` lets each test pin exact timing.
const createClock = (): TestClock => {
  const startedAt = START_MS;
  let cursor = startedAt;
  return {
    now: () => {
      const value = cursor;
      cursor += TICK_MS;
      return value;
    },
    startedAt,
  };
};

const okOptions = (clock: TestClock) => ({
  execute: () => BALANCE_AFTER_DEPOSIT,
  invariant: OK_INVARIANT,
  now: clock.now,
  observe: (balance: number) => balance,
  oracle: (balance: number) => balance > 0,
});

const failedOptions = (clock: TestClock) => ({
  execute: () => 0,
  invariant: OK_INVARIANT,
  now: clock.now,
  observe: (balance: number) => balance,
  oracle: (balance: number) => balance > 0,
});

const panicOptions = (clock: TestClock) => ({
  execute: () => {
    throw new Error('broken execution');
  },
  invariant: OK_INVARIANT,
  now: clock.now,
  observe: (balance: number) => balance,
  oracle: (balance: number) => balance > 0,
});

describe('the run id factory', () => {
  it('yields a distinct identity per invocation', () => {
    expect.hasAssertions();
    expect(createRunId()).not.toBe(createRunId());
  });
});

describe('runVerification: success', () => {
  it('records a successful run with identity and timing', () => {
    expect.hasAssertions();
    const clock = createClock();
    const run = runVerification(okOptions(clock));
    expect(run.status).toBe('ok');
    expect(run.runId).toHaveLength(UUID_V4_LENGTH);
    expect(run.durationMs).toBe(TICK_MS);
    expect(run.startedAt).toBe(clock.startedAt);
    expect(run.startedAt).toBeLessThanOrEqual(Date.now());
  });

  it('emits started then completed events for a successful run', () => {
    expect.hasAssertions();
    const run = runVerification(okOptions(createClock()));
    const names = run.events.map((event) => event.name);
    expect(names).toStrictEqual(['verification.run.started', 'verification.run.completed']);
    expect(run.events.every((event) => event.attributes.runId === run.runId)).toBe(true);
    expect(run.invariant).toBe(OK_INVARIANT);
    const observed = run.result.match({
      err: () => null,
      ok: (value) => value,
    });
    expect(observed).toBe(BALANCE_AFTER_DEPOSIT);
  });

  it('bounds the duration of a successful run', () => {
    expect.hasAssertions();
    const clock = createClock();
    const run = runVerification(okOptions(clock));
    expect(run.status).toBe('ok');
    expect(run.durationMs).toBe(TICK_MS);
    expect(run.startedAt).toBe(clock.startedAt);
  });
});

describe('runVerification: failure and defect', () => {
  it('records a failed run without an observation', () => {
    expect.hasAssertions();
    const run = runVerification(failedOptions(createClock()));
    expect(run.status).toBe('failed');
    const failure = run.result.match({
      err: (error) => error,
      ok: () => null,
    });
    expect(failure).toBeInstanceOf(VerificationFailed);
  });

  it('emits started then failed events for a failed run', () => {
    expect.hasAssertions();
    const run = runVerification(failedOptions(createClock()));
    const names = run.events.map((event) => event.name);
    expect(names).toStrictEqual(['verification.run.started', 'verification.run.failed']);
    expect(run.events.every((event) => event.attributes.runId === run.runId)).toBe(true);
  });

  it('bounds the duration of a failed run', () => {
    expect.hasAssertions();
    const clock = createClock();
    const run = runVerification(failedOptions(clock));
    expect(run.status).toBe('failed');
    expect(run.durationMs).toBe(TICK_MS);
    expect(run.startedAt).toBe(clock.startedAt);
  });

  it('propagates a defect as Panic, not a run', () => {
    expect.hasAssertions();
    expect(() => runVerification(panicOptions(createClock()))).toThrow(Error);
  });
});
