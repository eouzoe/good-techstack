import { Panic, Result, type Result as ResultType } from 'better-result';

import { VerificationFailed } from './result';

interface VerifyOptions<TValue, TObservation> {
  /** The thing under test runs here and yields its raw value. */
  execute: () => TValue;
  /** Turns the executed value into the observation the oracle can judge. */
  observe: (value: TValue) => TObservation;
  /** Oracle: decides whether the observation satisfies the invariant. */
  oracle: (observation: TObservation) => boolean;
  /** Human label for the invariant under verification (shows up in the failure). */
  invariant: string;
}

/// The primitive of the Verification Kernel (MVP slice: execute → observe → oracle → Result).
///
/// Three outcomes, kept distinct:
/// - invariant holds  → `Ok(observation)`
/// - invariant fails  → `Err(VerificationFailed)` — an expected, typed failure
/// - execute/observe/oracle throws → throws `Panic` (a defect), NOT folded into the error union.
///
/// Reason: `Err` is for failures a caller can meaningfully decide on. A thrown
/// callback is a defect; `better-result` models it as `Panic`, and we refuse to
/// widen the error union with `unknown` (see plan §12 / §47.9).
const wrapDefect = <TValue>(stage: 'execute' | 'observe' | 'oracle', fn: () => TValue): TValue => {
  try {
    return fn();
  } catch (error) {
    throw new Panic({ cause: error, message: `Verification stage "${stage}" threw unexpectedly` });
  }
};

const verify = <TValue, TObservation>(
  options: VerifyOptions<TValue, TObservation>,
): ResultType<TObservation, VerificationFailed> => {
  const { execute, observe, oracle, invariant } = options;
  const value = wrapDefect('execute', execute);
  const observation = wrapDefect('observe', () => observe(value));
  const satisfied = wrapDefect('oracle', () => oracle(observation));
  if (satisfied) {
    return Result.ok(observation);
  }
  return Result.err(
    new VerificationFailed({
      invariant,
      message: `Invariant "${invariant}" did not hold for observation: ${JSON.stringify(observation)}`,
    }),
  );
};

export type { VerifyOptions };
export { verify };
