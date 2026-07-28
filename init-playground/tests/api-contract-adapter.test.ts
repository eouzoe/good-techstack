import { describe, expect, it } from 'vitest';

import { contract } from '../src/shared/contracts/index';
import { getContractErrorMessage, getContractOutputSchema } from './contract-common';

/// Phase C — defensive tests for the *test adapter itself*.
///
/// These harden the ``tests/contract-common.ts`` guards so a malformed oRPC
/// procedure fails with the clean, caller-visible guard error rather than a
/// confusing downstream panic. If ``getContractOutputSchema``/``getContractErrorMessage``
/// are ever mutated past their guard, these tests must go red.

describe('contract adapter guards (tests/contract-common.ts)', () => {
  it('throws a clean error when a procedure declares no output schema', () => {
    expect.hasAssertions();
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- deliberate shape-malformed stand-in for the real oRPC procedure type.
    const schemaLessProc = { '~orpc': {} } as unknown as Parameters<typeof getContractOutputSchema>[0];
    expect(() => getContractOutputSchema(schemaLessProc)).toThrow('declares no output schema');
  });

  it('throws a clean error when a procedure declares no error map entry', () => {
    expect.hasAssertions();
    const proc = contract.info.techs;
    expect(() => getContractErrorMessage(proc, 'NOPE')).toThrow(`declares no 'NOPE' entry`);
  });
});

/// Phase C — structural pin of the contract object shape.
///
/// Guards the ``info`` key composition: if any sub-parcel (events/features/
/// pageMeta/techs) is dropped or renamed, this suite turns red. Directly checks
/// the object literal mutants Stryker reported (``const contract = {}``,
/// ``info: {}``).
describe('contract shape (§6.3)', () => {
  it('exposes exactly the four info sub-procedures', () => {
    expect.hasAssertions();
    expect(Object.keys(contract.info).toSorted()).toStrictEqual(['events', 'features', 'pageMeta', 'techs']);
  });

  it('reveals every stored sub-procedure through the shared output schema adapter', () => {
    expect.hasAssertions();
    const { info } = contract;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- keys are statically known to be the four info procs; narrowing is safe.
    const entries = Object.entries(info) as [keyof typeof info, (typeof info)[keyof typeof info]][];
    for (const [key, proc] of entries) {
      expect(() => getContractOutputSchema(proc)).not.toThrow();
      void key;
    }
  });
});