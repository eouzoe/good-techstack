import { Panic, Result } from 'better-result';
import { describe, expect, it } from 'vitest';

import { VerificationFailed as VerificationFailedTag } from './result';
import { verify } from './verify';

const OBSERVED_BALANCE = 101;
const BALANCE_AFTER_DEPOSIT = 100;
const NEGATIVE_BALANCE = -5;
const PANIC_MESSAGE = 'broken invariant computation';
const INVARIANT = 'balance stays non-negative';

const throwingVerify = () =>
  verify({
    execute: () => {
      throw new Error(PANIC_MESSAGE);
    },
    invariant: 'never reached',
    observe: (value) => value,
    oracle: (observation) => observation > 0,
  });

const verifyWithThrowingObserve = () =>
  verify({
    execute: () => BALANCE_AFTER_DEPOSIT,
    invariant: 'never reached',
    observe: () => {
      throw new Error(PANIC_MESSAGE);
    },
    oracle: (observation) => observation > 0,
  });

const verifyWithThrowingOracle = () =>
  verify({
    execute: () => BALANCE_AFTER_DEPOSIT,
    invariant: 'never reached',
    observe: (value) => value,
    oracle: () => {
      throw new Error(PANIC_MESSAGE);
    },
  });

const okOptions = () => ({
  execute: () => BALANCE_AFTER_DEPOSIT,
  invariant: INVARIANT,
  observe: (balance: number) => balance + 1,
  oracle: (observation: number) => observation >= 0,
});

const failedOptions = () => ({
  execute: () => NEGATIVE_BALANCE,
  invariant: INVARIANT,
  observe: (balance: number) => balance,
  oracle: (observation: number) => observation >= 0,
});

describe('verification: verify', () => {
  it('returns Ok(observation) when the invariant holds', () => {
    expect.hasAssertions();
    const result = verify(okOptions());

    expect(Result.isOk(result)).toBe(true);
    expect(
      result.match({
        err: () => OBSERVED_BALANCE,
        ok: (observation) => observation,
      }),
    ).toBe(OBSERVED_BALANCE);
  });

  it('returns Err(VerificationFailed) when the invariant is false', () => {
    expect.hasAssertions();
    const result = verify(failedOptions());

    expect(Result.isError(result)).toBe(true);
    const failure = result.match({
      err: (error) => error,
      ok: () => null,
    });
    expect(failure).toBeInstanceOf(VerificationFailedTag);
  });

  it('tags a failed result and labels it with the invariant', () => {
    expect.hasAssertions();
    const failure = verify(failedOptions()).match({
      err: (error) => error,
      ok: () => null,
    });

    expect(failure?._tag).toBe('VerificationFailed');
    expect(failure?.message).toContain(INVARIANT);
  });
});

describe('verification: defect propagation', () => {
  it('propagates a defect from execute as a Panic naming the stage, not Err', () => {
    expect.hasAssertions();
    expect(throwingVerify).toThrow(Panic);
    expect(throwingVerify).toThrow('Verification stage "execute" threw');
  });

  it('propagates a defect from observe as a Panic naming the stage, not Err', () => {
    expect.hasAssertions();
    expect(verifyWithThrowingObserve).toThrow(Panic);
    expect(verifyWithThrowingObserve).toThrow('Verification stage "observe" threw');
  });

  it('propagates a defect from oracle as a Panic naming the stage, not Err', () => {
    expect.hasAssertions();
    expect(verifyWithThrowingOracle).toThrow(Panic);
    expect(verifyWithThrowingOracle).toThrow('Verification stage "oracle" threw');
  });
});
