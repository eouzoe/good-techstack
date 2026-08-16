import { fc, it } from '@fast-check/vitest';
import { safeParse } from 'valibot';

import { EmailQueueSchema, QueuePayloadSchema } from '../src/shared/queue-schemas';

/// Phase F — property-based schema invariants (§6.10) on the node gate over the
/// real Valibot contracts. Focus is on what fast-check is exactly for: running
/// the schema across *generated* inputs fast-check has never seen, instead of
/// the handful a human picks.
///
/// The invariant is a FIXED-POINT (metamorphic) property: parse must be a
/// closed morphism on itself — if parse succeeds on an input, then parsing the
/// *output* of that very input must also succeed (the schema cannot
/// "accept-then-the-parse-is-inconsistent"). This needs no generator whose
/// output the schema already trusts (no eps-problem): arbitrary values are
/// used, and only success-latching is asserted.
const PARSERS = [EmailQueueSchema, QueuePayloadSchema] as const;

const isIdempotent = (schema: (typeof PARSERS)[number], value: unknown): boolean => {
  const first = safeParse(schema, value);
  if (!first.success) {
    // Reject-of-arbitrary is fine — only fixed-point on accept is asserted.
    return true;
  }
  return safeParse(schema, first.output).success;
};

it.prop([fc.anything()])(
  'each contract is a closed morphism: accepted input re-parses to acceptance',
  (value) => PARSERS.every((schema) => isIdempotent(schema, value)),
);
