import { describe, expect, it } from 'vitest';

import { reportToJson, reportToJsonl, serializeRun } from './report';
import { runVerification } from './run';

const BALANCE_AFTER_DEPOSIT = 100;
const OK_INVARIANT = 'balance never drops below zero after a deposit';
const UUID_V4_LENGTH = 36;

const okOptions = {
  execute: () => BALANCE_AFTER_DEPOSIT,
  invariant: OK_INVARIANT,
  observe: (balance: number) => balance,
  oracle: (balance: number) => balance > 0,
};

const failedOptions = () => ({
  execute: () => 0,
  invariant: OK_INVARIANT,
  observe: (balance: number) => balance,
  oracle: (balance: number) => balance > 0,
});

describe('report: serializeRun shape', () => {
  it('lifts a successful run to its machine-readable report', () => {
    expect.hasAssertions();
    const report = serializeRun(runVerification(okOptions));
    expect(report.status).toBe('ok');
    expect(report.run_id).toHaveLength(UUID_V4_LENGTH);
    expect(report.invariant).toBe(OK_INVARIANT);
    expect(report.duration_ms).toBeGreaterThanOrEqual(0);
    expect(report.started_at).toBeGreaterThan(0);
  });

  it('maps each emitted event into a flat event report', () => {
    expect.hasAssertions();
    const report = serializeRun(runVerification(okOptions));
    const names = report.events.map((event) => event.name);
    expect(names).toStrictEqual(['verification.run.started', 'verification.run.completed']);
    expect(report.events.every((event) => event.run_id === report.run_id)).toBe(true);
    expect(report.events.every((event) => event.timestamp > 0)).toBe(true);
  });

  it('labels a failed run without losing its identity', () => {
    expect.hasAssertions();
    const report = serializeRun(runVerification(failedOptions()));
    expect(report.status).toBe('failed');
    const names = report.events.map((event) => event.name);
    expect(names).toStrictEqual(['verification.run.started', 'verification.run.failed']);
    expect(report.run_id).toHaveLength(UUID_V4_LENGTH);
  });
});

describe('report: JSON serialization', () => {
  it('round-trips through JSON.stringify', () => {
    expect.hasAssertions();
    const report = serializeRun(runVerification(okOptions));
    expect(JSON.parse(reportToJson(report))).toStrictEqual(report);
  });

  it('emits one JSONL line per event plus a final summary line', () => {
    expect.hasAssertions();
    const report = serializeRun(runVerification(okOptions));
    const lines = reportToJsonl(report).split('\n');
    expect(lines).toHaveLength(report.events.length + 1);
    expect(lines.slice(0, report.events.length)).toStrictEqual(
      report.events.map((event) => JSON.stringify(event)),
    );
    expect(lines[report.events.length]).toBe(JSON.stringify(report));
  });
});