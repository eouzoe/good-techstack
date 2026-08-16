import { Result, type Result as ResultType } from 'better-result';

import {
  type VerificationEvent,
  verificationRunCompleted,
  verificationRunFailed,
  verificationRunStarted,
} from './observation';
import { type VerificationFailed } from './result';
import { type VerifyOptions, verify } from './verify';

/// Canonical run identity for one verification execution (plan §7, §26).
/// `run_id` is the identity of this verification, not a database primary key.
const createRunId = (): string => crypto.randomUUID();

type VerificationRunStatus = 'ok' | 'failed';

/// A successful verification run.
interface OkRun<TObservation> {
  runId: string;
  status: 'ok';
  startedAt: number;
  durationMs: number;
  invariant: string;
  observation: TObservation;
  result: ResultType<TObservation, VerificationFailed>;
  events: VerificationEvent[];
}

/// A verification run whose invariant did not hold.
interface FailedRun<TObservation> {
  runId: string;
  status: 'failed';
  startedAt: number;
  durationMs: number;
  invariant: string;
  result: ResultType<TObservation, VerificationFailed>;
  events: VerificationEvent[];
}

/// The canonical `VerificationRun` — ONE RUN → ONE ID → ONE RESULT MODEL → ALL INTERFACES.
///
/// A panicked (defect) execution is NOT represented here: `Panic` propagates to the
/// calling supervisor, keeping expected outcomes (ok/failed) and defects separate
/// (see plan §12 / §47.9).
type VerificationRun<TObservation> = FailedRun<TObservation> | OkRun<TObservation>;

/// `VerifyOptions` plus an injectable clock. Defaults to `Date.now`, so callers
/// keep the zero-config surface; tests (and later fault-injection harnesses)
/// supply a deterministic clock to pin timing semantics — including inverted or
/// constant durations that ms-resolution wall clock would mask.
interface RunVerificationOptions<TValue, TObservation> extends VerifyOptions<TValue, TObservation> {
  now?: () => number;
}

const runVerification = <TValue, TObservation>(
  options: RunVerificationOptions<TValue, TObservation>,
): VerificationRun<TObservation> => {
  const { now = Date.now, ...verifyOptions } = options;
  const startedAt = now();
  const runId = createRunId();
  const result = verify(verifyOptions);
  const finishedAt = now();

  if (Result.isOk(result)) {
    return {
      durationMs: finishedAt - startedAt,
      events: [
        verificationRunStarted(runId, startedAt),
        verificationRunCompleted(runId, finishedAt),
      ],
      invariant: options.invariant,
      observation: result.value,
      result,
      runId,
      startedAt,
      status: 'ok',
    };
  }

  return {
    durationMs: finishedAt - startedAt,
    events: [verificationRunStarted(runId, startedAt), verificationRunFailed(runId, finishedAt)],
    invariant: options.invariant,
    result,
    runId,
    startedAt,
    status: 'failed',
  };
};

export type { RunVerificationOptions, VerificationRun, VerificationRunStatus };
export { createRunId, runVerification };
