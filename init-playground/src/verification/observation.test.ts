import { describe, expect, it } from 'vitest';

import { verificationRunCompleted, verificationRunFailed, verificationRunStarted } from './observation';

const RUN_ID = '1f8f5b2a-5d4a-4c3b-9a2e-6b7c8d9e0f10';
const STARTED_AT = 1_600_000_000_000;
const FINISHED_AT = 1_600_000_000_042;

describe('observation: verification run events', () => {
  it('records a started event bound to the run id', () => {
    expect.hasAssertions();
    const event = verificationRunStarted(RUN_ID, STARTED_AT);
    expect(event.name).toBe('verification.run.started');
    expect(event.timestamp).toBe(STARTED_AT);
    expect(event.attributes.runId).toBe(RUN_ID);
  });

  it('records a completed event bound to the run id', () => {
    expect.hasAssertions();
    const event = verificationRunCompleted(RUN_ID, FINISHED_AT);
    expect(event.name).toBe('verification.run.completed');
    expect(event.timestamp).toBe(FINISHED_AT);
    expect(event.attributes.runId).toBe(RUN_ID);
  });

  it('records a failed event bound to the run id', () => {
    expect.hasAssertions();
    const event = verificationRunFailed(RUN_ID, FINISHED_AT);
    expect(event.name).toBe('verification.run.failed');
    expect(event.timestamp).toBe(FINISHED_AT);
    expect(event.attributes.runId).toBe(RUN_ID);
  });

  it('keeps the three lifecycle names distinct', () => {
    expect.hasAssertions();
    const started = verificationRunStarted(RUN_ID, STARTED_AT);
    const completed = verificationRunCompleted(RUN_ID, FINISHED_AT);
    const failed = verificationRunFailed(RUN_ID, FINISHED_AT);
    expect(completed.name).not.toBe(started.name);
    expect(failed.name).not.toBe(started.name);
    expect(failed.name).not.toBe(completed.name);
  });
});
