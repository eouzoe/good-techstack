import { describe, expect, it } from 'vitest';

import { serializeSuite, suiteToJson } from './report';
import { runSuite } from './suite';
import { type VerifyOptions } from './verify';

const BALANCE_AFTER_DEPOSIT = 100;
const OK_INVARIANT = 'balance never drops below zero after a deposit';
const UUID_V4_LENGTH = 36;
const VERIFIED_COUNT = 2;
const RUN_COUNT = 3;
const START_MS = 1_600_000_000_000;
const TICK_MS = 42;
const SUITE_CALL_COUNT = 5;
const PASSING_SUITE_CALL_COUNT = 3;

const createClock = (): { now: () => number } => {
  let calls = 0;
  return {
    now: () => START_MS + calls++ * TICK_MS,
  };
};

const caseWithBalance = (balance: number): VerifyOptions<unknown, unknown> => ({
  execute: () => balance,
  invariant: OK_INVARIANT,
  observe: (value: unknown) => value,
  oracle: (value: unknown) => typeof value === 'number' && value > 0,
});

describe('suite: timing', () => {
  it('pins duration from the injected clock across a failing suite', () => {
    expect.hasAssertions();
    const { now } = createClock();
    const suite = runSuite(
      [caseWithBalance(BALANCE_AFTER_DEPOSIT), caseWithBalance(0)],
      { now },
    );
    expect(suite.startedAt).toBe(START_MS);
    expect(suite.finishedAt).toBe(START_MS + TICK_MS * SUITE_CALL_COUNT);
    expect(suite.durationMs).toBe(TICK_MS * SUITE_CALL_COUNT);
  });

  it('pins duration from the injected clock across a passing suite', () => {
    expect.hasAssertions();
    const { now } = createClock();
    const suite = runSuite([caseWithBalance(BALANCE_AFTER_DEPOSIT)], { now });
    expect(suite.durationMs).toBe(TICK_MS * PASSING_SUITE_CALL_COUNT);
  });
});

describe('suite: aggregation', () => {
  it('sums verified and failed across cases', () => {
    expect.hasAssertions();
    const suite = runSuite([caseWithBalance(BALANCE_AFTER_DEPOSIT), caseWithBalance(0), caseWithBalance(BALANCE_AFTER_DEPOSIT)]);
    expect(suite.verified).toBe(VERIFIED_COUNT);
    expect(suite.failed).toBe(1);
    expect(suite.runs).toHaveLength(RUN_COUNT);
  });

  it('yields a single suite run id for the whole invocation', () => {
    expect.hasAssertions();
    const suite = runSuite([caseWithBalance(0), caseWithBalance(BALANCE_AFTER_DEPOSIT)]);
    expect(suite.runId).toHaveLength(UUID_V4_LENGTH);
    expect(suite.runs.every((run) => run.runId !== suite.runId)).toBe(true);
  });

  it('is ok only when every case holds', () => {
    expect.hasAssertions();
    expect(runSuite([caseWithBalance(BALANCE_AFTER_DEPOSIT)]).status).toBe('ok');
    expect(runSuite([caseWithBalance(0)]).status).toBe('failed');
  });
});

describe('suite: machine-readable summary', () => {
  it('serializes to the §1.4 summary shape', () => {
    expect.hasAssertions();
    const suite = runSuite([caseWithBalance(BALANCE_AFTER_DEPOSIT), caseWithBalance(0)]);
    const summary = serializeSuite(suite);
    expect(summary).toStrictEqual({
      duration_ms: suite.durationMs,
      failed: 1,
      run_id: suite.runId,
      status: 'failed',
      verified: 1,
    });
  });

  it('json round-trips to the same summary', () => {
    expect.hasAssertions();
    const suite = runSuite([caseWithBalance(BALANCE_AFTER_DEPOSIT)]);
    expect(JSON.parse(suiteToJson(suite))).toStrictEqual(serializeSuite(suite));
  });

  it('reports a passing suite as passed', () => {
    expect.hasAssertions();
    const suite = runSuite([caseWithBalance(BALANCE_AFTER_DEPOSIT)]);
    expect(serializeSuite(suite).status).toBe('passed');
  });
});