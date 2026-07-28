/// Structured observations of one verification run (plan §35, §46.6).
///
/// A `VerificationEvent` is a named, low-cardinality, fully-qualified event
/// bound to a single `runId`. `name` encodes the lifecycle stage — `status`
/// is NOT a separate field, because the name already distinguishes
/// completed vs failed (see OTel event naming guidelines).
///
/// This is the Observation layer of the Kernel: `VerificationEvent → adapter →
/// OpenTelemetry exporter`. The core stays free of exporter dependencies.
interface VerificationEventAttributes {
  /** Canonical identity of the run this event belongs to (plan §7). */
  runId: string;
}

type VerificationEventName =
  | 'verification.run.started'
  | 'verification.run.completed'
  | 'verification.run.failed';

/// One structured observation point of a verification run.
interface VerificationEvent {
  /** Fully-qualified event name; low-cardinality, encodes the lifecycle stage. */
  name: VerificationEventName;
  /** Epoch milliseconds when the event occurred. */
  timestamp: number;
  /** Structured event details; grows in later phases (invariant, durationMs, …). */
  attributes: VerificationEventAttributes;
}

const verificationRunStarted = (runId: string, timestamp: number): VerificationEvent => ({
  attributes: { runId },
  name: 'verification.run.started',
  timestamp,
});

const verificationRunCompleted = (runId: string, timestamp: number): VerificationEvent => ({
  attributes: { runId },
  name: 'verification.run.completed',
  timestamp,
});

const verificationRunFailed = (runId: string, timestamp: number): VerificationEvent => ({
  attributes: { runId },
  name: 'verification.run.failed',
  timestamp,
});

export type { VerificationEvent, VerificationEventName };
export { verificationRunCompleted, verificationRunFailed, verificationRunStarted };
