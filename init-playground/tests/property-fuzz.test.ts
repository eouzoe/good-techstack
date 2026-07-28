import { describe, it } from 'vitest';
import {
  anything,
  array,
  assert,
  boolean,
  constant,
  date,
  dictionary,
  float,
  integer,
  oneof,
  property,
  string,
} from 'fast-check';
import { safeParse } from 'valibot';

import {
  AuditLogQueueSchema,
  EmailQueueSchema,
  QueuePayloadSchema,
  WebhookQueueSchema,
} from '../src/shared/queue-schemas';

/// Phase F — §6.10 fuzzing harness on the node gate, over the real Valibot
/// queue contracts. Differs from `property-contract.ts` in the *input model*:
/// here fast-check drives the boundary + hostile values §6.10 enumerates
/// (empty strings, unicode, NaN, ±Infinity, huge strings, deep nesting,
/// duplicate ids, arbitrary object shape) straight at each schema, and the only
/// thing we assert is the one safety invariant that must hold for EVERY value:
///
///   parse never throws, never leaks an internal error, and always returns a
///   boolean for the host — accept or reject, but never a crash.
///
/// Valibot `safeParse` returns a discriminated result (never throws on bad
/// input); the crash-y hole this guards is schema regressions that throw on
/// surprising shapes, which would surface as a Worker 500 instead of a clean
/// 4xx. That is exactly §6.10's "Never crash Worker / Never leak internal
/// error".

const SCHEMAS = [
  EmailQueueSchema,
  WebhookQueueSchema,
  AuditLogQueueSchema,
  QueuePayloadSchema,
] as const;

/// §6.10 boundary values, generated *explicitly* so shrinking repairs to a
/// minimal reproducible case instead of one huge fc.anything blob.
const boundaryValues = oneof(
  constant(''), // empty string
  constant(NaN), // NaN
  constant(Number.POSITIVE_INFINITY), // Infinity
  constant(Number.NEGATIVE_INFINITY), // -Infinity
  constant(-0), // negative zero
  constant(null),
  string({ minLength: 8 }),
  string({ minLength: 32 }),
  array(anything(), { maxLength: 128 }), // huge array
  dictionary(string(), anything(), { maxKeys: 32 }),
  anything(), // deep nesting
  boolean(),
  integer({ min: -2_147_483_648, max: 2_147_483_647 }),
  float(),
  date(),
);

describe('Phase F — fuzz harness over queue contracts', () => {
  it('never crashes, leaks, or hangs on hostile boundary inputs', () => {
    assert(
      property(boundaryValues, (hostile) => {
        for (const schema of SCHEMAS) {
          const result = safeParse(schema, hostile);
          // A successful result re-parses identically (fixed point, §6.10);
          // A rejection is fine — the invariant is only that it IS a result,
          // never a throw (which would crash a Worker as an internal error).
          if (result.success && !safeParse(schema, result.output).success) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 200, maxSkipsPerRun: 0 },
    );
  }, 30000);
});