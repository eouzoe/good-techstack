import { type VerificationEvent } from './observation';
import { type VerificationRun } from './run';
import { type SuiteRun } from './suite';

/// Machine-readable (JSON / JSONL) adapter for one VerificationRun (plan §1.4).
///
/// This is the Observation → output boundary of the Kernel. It stays a PURE
/// transform: it holds no emitter, no exporter, no I/O. `devenv --trace-to`,
/// Cloudflare Observability, or a JSONL sink pipe this shape somewhere else.
///
/// Wire field names are snake_case (`run_id`, `duration_ms`) on purpose: on the
/// cross-boundary serialization surface we follow the run identity vocabulary of
/// §1.4 / §8.1 instead of the in-memory camelCase domain names. Low-cardinality
/// and stable — consumers never parse implementation detail.
type RunStatus = 'ok' | 'failed';

interface EventReport {
  name: string;
  run_id: string;
  timestamp: number;
}

interface VerificationReport {
  duration_ms: number;
  events: EventReport[];
  invariant: string;
  run_id: string;
  started_at: number;
  status: RunStatus;
}

const serializeEvent = (event: VerificationEvent): EventReport => ({
  name: event.name,
  run_id: event.attributes.runId,
  timestamp: event.timestamp,
});

/// Lifts a `VerificationRun` into its machine-readable report shape.
/// The in-memory `VerificationRun` (camelCase, Result-typed) never crosses a
/// boundary; this plain JSON-serializable value does. Same identity → same report.
const serializeRun = <TObservation = unknown>(
  run: VerificationRun<TObservation>,
): VerificationReport => ({
  duration_ms: run.durationMs,
  events: run.events.map(serializeEvent),
  invariant: run.invariant,
  run_id: run.runId,
  started_at: run.startedAt,
  status: run.status,
});

/// One JSONL line per event, plus a final summary line carrying the whole report.
/// Keep-away: this is the string surface you can `tail -f`, filter with `jq`,
/// or ship to a `json` trace destination without building a second model.
const reportToJsonl = (report: VerificationReport): string => {
  const eventLines = report.events.map((event) => JSON.stringify(event));
  const summaryLine = JSON.stringify(report);
  return [...eventLines, summaryLine].join('\n');
};

const reportToJson = (report: VerificationReport): string => JSON.stringify(report);

/// Machine-readable shape of a whole suite run (plan §1.4). Note `status`
/// upgrades to `'passed'` / `'failed'` — the §1.4 vocabulary, distinct from the
/// single-run `ok` / `failed` — so consumers read "a run passed/failed" without
/// conflating it with the our human-facing per-case status.
interface SuiteSummary {
  duration_ms: number;
  failed: number;
  run_id: string;
  status: 'passed' | 'failed';
  verified: number;
}

const serializeSuite = (suite: SuiteRun): SuiteSummary => {
  if (suite.status === 'ok') {
    return {
      duration_ms: suite.durationMs,
      failed: suite.failed,
      run_id: suite.runId,
      status: 'passed',
      verified: suite.verified,
    };
  }
  return {
    duration_ms: suite.durationMs,
    failed: suite.failed,
    run_id: suite.runId,
    status: 'failed',
    verified: suite.verified,
  };
};

const suiteToJson = (suite: SuiteRun): string => JSON.stringify(serializeSuite(suite));

export type { EventReport, SuiteSummary, VerificationReport };
export { reportToJson, reportToJsonl, serializeEvent, serializeRun, serializeSuite, suiteToJson };
