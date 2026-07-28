import { createRunId, runVerification, type VerificationRun } from './run';
import { type VerifyOptions } from './verify';

/// Aggregates many `VerifyOptions` cases into one suite run (plan §1.3 / §1.4).
///
/// A suite has ONE run_id — the identity of this whole `just test` invocation —
/// and yields the machine-readable counts the Plan's §1.4 summary needs:
/// verified / failed, plus a final status. It is the "instantiate the kernel over
/// a set of cases" boundary: same kernel, one summarizing handle.
///
/// Design note: the suite keeps every child run (NOT just counts), so a failing
/// case stays identifiable by its own child run_id — failure is uniquely
/// attributed, not flattened into a number.
interface SuiteRun {
  /** Identity of this whole suite invocation (plan §7). */
  runId: string;
  /** Epoch ms when the suite began. */
  startedAt: number;
  /** Epoch ms when the suite finished. */
  finishedAt: number;
  /** Wall-clock duration of the whole suite. */
  durationMs: number;
  /** `'ok'` when every case passed, else `'failed'`. */
  status: 'ok' | 'failed';
  /** Number of runs whose invariant held. */
  verified: number;
  /** Number of runs whose invariant did not hold. */
  failed: number;
  /** Every child run, kept for per-case identity. */
  runs: VerificationRun<unknown>[];
}

interface SuiteOptions {
  /** Clock override for deterministic timing (same contract as `runVerification`). */
  now?: () => number;
}

const computeCounts = (
  runs: VerificationRun<unknown>[],
): { verified: number; failed: number } => {
  const verified = runs.filter((run) => run.status === 'ok').length;
  return { failed: runs.length - verified, verified };
};

const runSuite = (cases: VerifyOptions<unknown, unknown>[], options: SuiteOptions = {}): SuiteRun => {
  const { now = Date.now } = options;
  const startedAt = now();
  const runId = createRunId();
  const runs = cases.map((case_) => runVerification({ ...case_, now }));
  const finishedAt = now();
  const { failed, verified } = computeCounts(runs);

  if (failed === 0) {
    return {
      durationMs: finishedAt - startedAt,
      failed,
      finishedAt,
      runId,
      runs,
      startedAt,
      status: 'ok',
      verified,
    };
  }
  return {
    durationMs: finishedAt - startedAt,
    failed,
    finishedAt,
    runId,
    runs,
    startedAt,
    status: 'failed',
    verified,
  };
};

export type { SuiteRun };
export { runSuite };