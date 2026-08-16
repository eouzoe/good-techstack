import { minLength, pipe, safeParse, string } from 'valibot';
import { describe, expect, it } from 'vitest';

import { runSuite } from '../src/verification/suite';
import { type VerifyOptions } from '../src/verification/verify';

const MIN_LENGTH = 5;

const basicString = string();
const minLengthString = pipe(string(), minLength(MIN_LENGTH));

const stringInvariants: VerifyOptions<unknown, unknown>[] = [
  {
    execute: () => 'hello',
    invariant: 'any string is accepted by the basic string schema',
    observe: (value: unknown) => value,
    oracle: (value: unknown) => safeParse(basicString, value).success,
  },
  {
    execute: () => 'hi',
    invariant: 'strings shorter than the min length are always rejected',
    observe: (value: unknown) => value,
    oracle: (value: unknown) => !safeParse(minLengthString, value).success,
  },
];

describe('valibot basics — invariant form (§1.6/§1.7)', () => {
  it('valibot string invariants all hold', () => {
    expect.hasAssertions();
    const suite = runSuite(stringInvariants);
    expect(suite.status).toBe('ok');
    expect(suite.failed).toBe(0);
  });
});
